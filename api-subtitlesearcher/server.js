import 'dotenv/config';
import archiver from 'archiver';
import express from 'express';

import { createOpenSubtitlesClient } from './lib/os-client.js';
import { collectSubtitleFiles, safeFilenamePart } from './lib/media-subtitles.js';
import { ensureQuoteIndex, searchSimilarQuotes } from './lib/quote-index.js';
import { createLogger } from './lib/logger.js';

const RATE_LIMIT_DELAY_MS = Number(process.env.OS_RATE_LIMIT_DELAY_MS) || 2000;
const MEDIA_SUBTITLE_MAX_FILES = Number(process.env.MEDIA_SUBTITLE_MAX_FILES) || 60;
const QUOTE_SEARCH_MAX_FILES = Number(process.env.QUOTE_SEARCH_MAX_FILES) || 1;

class RateLimitedQueue {
  /**
   * @param {number} delayMs
   */
  constructor(delayMs) {
    this.delayMs = delayMs;
    /** @type {{ fn: () => Promise<unknown>, resolve: (v: unknown) => void, reject: (e: unknown) => void }[]} */
    this.queue = [];
    this.running = false;
  }

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      void this.pump();
    });
  }

  async pump() {
    if (this.running) return;
    if (this.queue.length === 0) return;
    this.running = true;
    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      try {
        const result = await fn();
        resolve(result);
      } catch (e) {
        reject(e);
      }
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
    this.running = false;
  }
}

const requestQueue = new RateLimitedQueue(RATE_LIMIT_DELAY_MS);
const osClient = createOpenSubtitlesClient(process.env, requestQueue);
const logger = createLogger({ app: 'api-subtitlesearcher' });

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  logger.info('http.request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    ua: req.headers['user-agent'],
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Subtitle API is running.',
    endpoints: {
      sample: 'GET /api/subtitles?query=Inception',
      download_zip:
        'GET /api/media/subtitles.zip?query=Breaking%20Bad&languages=en (optional: season_number, episode_number, parent_imdb_id, parent_tmdb_id, imdb_id, tmdb_id, max_files)',
      quote_search:
        'GET /api/quotes/similar?media=Breaking%20Bad&quote=I%20am%20the%20danger&limit=5',
    },
  });
});

/**
 * @param {unknown} v
 * @param {number} [defaultVal]
 */
function parseOptionalInt(v, defaultVal) {
  if (v === undefined || v === null || v === '') return defaultVal;
  const n = parseInt(String(Array.isArray(v) ? v[0] : v), 10);
  return Number.isFinite(n) ? n : defaultVal;
}

app.get('/api/subtitles', async (req, res) => {
  const query = req.query.query;
  if (query === undefined || query === null || String(query).trim() === '') {
    return res.status(422).json({
      detail: [
        {
          loc: ['query', 'query'],
          msg: 'field required',
          type: 'value_error.missing',
        },
      ],
    });
  }

  const q = Array.isArray(query) ? query[0] : query;

  try {
    logger.info('subtitles.sample', { query: String(q) });
    const sample = await osClient.fetchSubtitleSample(String(q));
    res.json({
      status: 'success',
      query: String(q),
      sample,
    });
  } catch (e) {
    console.error('\n' + '='.repeat(50));
    console.error('ERROR FETCHING SUBTITLES:', e);
    console.error('='.repeat(50) + '\n');
    const message = e instanceof Error ? e.message : String(e);
    logger.error('subtitles.sample_error', { query: String(q), message });
    res.status(500).json({ detail: message });
  }
});

/**
 * Download multiple subtitle files as a ZIP.
 * TV: pass season_number + episode_number (and optionally parent_imdb_id / parent_tmdb_id) for a specific episode;
 * omit season/episode to collect up to max_files matches across paginated search (many episodes for a series).
 */
app.get('/api/media/subtitles.zip', async (req, res) => {
  const query = req.query.query;
  if (query === undefined || query === null || String(query).trim() === '') {
    return res.status(422).json({ detail: 'query is required' });
  }
  const q = String(Array.isArray(query) ? query[0] : query).trim();
  const languages = String(req.query.languages ?? 'en');
  const maxFiles = Math.min(
    parseOptionalInt(req.query.max_files, MEDIA_SUBTITLE_MAX_FILES) ?? MEDIA_SUBTITLE_MAX_FILES,
    Number(process.env.MEDIA_SUBTITLE_MAX_FILES_CAP) || 200,
  );
  const season_number = parseOptionalInt(req.query.season_number, undefined);
  const episode_number = parseOptionalInt(req.query.episode_number, undefined);
  const parent_imdb_id = parseOptionalInt(req.query.parent_imdb_id, undefined);
  const parent_tmdb_id = parseOptionalInt(req.query.parent_tmdb_id, undefined);
  const imdb_id = parseOptionalInt(req.query.imdb_id, undefined);
  const tmdb_id = parseOptionalInt(req.query.tmdb_id, undefined);

  try {
    logger.info('subtitles.zip_request', {
      query: q,
      languages,
      maxFiles,
      season_number,
      episode_number,
      parent_imdb_id,
      parent_tmdb_id,
      imdb_id,
      tmdb_id,
    });
    const files = await collectSubtitleFiles(osClient, {
      query: q,
      languages,
      maxFiles,
      ...(season_number !== undefined && { season_number }),
      ...(episode_number !== undefined && { episode_number }),
      ...(parent_imdb_id !== undefined && { parent_imdb_id }),
      ...(parent_tmdb_id !== undefined && { parent_tmdb_id }),
      ...(imdb_id !== undefined && { imdb_id }),
      ...(tmdb_id !== undefined && { tmdb_id }),
    });

    if (files.length === 0) {
      logger.warn('subtitles.zip_no_files', { query: q, languages });
      return res.status(404).json({ detail: 'No subtitle files found for this query.' });
    }

    const archive = archiver('zip', { zlib: { level: 6 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFilenamePart(q)}.subtitles.zip"`,
    );
    archive.on('error', (err) => {
      console.error('ZIP error:', err);
      logger.error('subtitles.zip_error', { query: q, message: err.message });
      if (!res.headersSent) {
        res.status(500).json({ detail: err.message });
      }
    });
    archive.pipe(res);

    for (const f of files) {
      try {
        logger.info('subtitles.zip_download_start', { query: q, fileId: f.fileId, episodeLabel: f.episodeLabel });
        const text = await osClient.downloadSubtitleText(f.fileId);
        const base = safeFilenamePart(f.episodeLabel);
        const name = `${base}.${languages}.srt`;
        archive.append(text, { name });
        logger.info('subtitles.zip_download_ok', {
          query: q,
          fileId: f.fileId,
          bytes: Buffer.byteLength(text, 'utf8'),
          name,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.warn('subtitles.zip_download_failed', { query: q, fileId: f.fileId, message: msg });
        archive.append(`Download failed: ${msg}\n`, {
          name: `_errors/${f.fileId}.txt`,
        });
      }
    }

    logger.info('subtitles.zip_finalize', { query: q, files: files.length });
    await archive.finalize();
  } catch (e) {
    console.error('Bulk subtitle download error:', e);
    const message = e instanceof Error ? e.message : String(e);
    logger.error('subtitles.zip_fatal', { query: q, message });
    if (!res.headersSent) {
      res.status(500).json({ detail: message });
    }
  }
});

/**
 * Semantic quote search over subtitle cues (Vectra + local embeddings).
 */
app.get('/api/quotes/similar', async (req, res) => {
  const media = req.query.media;
  const quote = req.query.quote;
  if (media === undefined || media === null || String(media).trim() === '') {
    return res.status(422).json({ detail: 'media is required (show or movie title)' });
  }
  if (quote === undefined || quote === null || String(quote).trim() === '') {
    return res.status(422).json({ detail: 'quote is required' });
  }

  const m = String(Array.isArray(media) ? media[0] : media).trim();
  const q = String(Array.isArray(quote) ? quote[0] : quote).trim();
  const languages = String(req.query.languages ?? 'en');
  const limit = Math.min(parseOptionalInt(req.query.limit, 10) ?? 10, 50);
  const forceRebuild = String(req.query.refresh ?? '') === '1' || String(req.query.refresh ?? '') === 'true';
  const maxSubtitleFiles = Math.min(
    parseOptionalInt(req.query.max_subtitle_files, QUOTE_SEARCH_MAX_FILES) ?? QUOTE_SEARCH_MAX_FILES,
    Number(process.env.QUOTE_SEARCH_MAX_FILES_CAP) || 25,
  );

  const season_number = parseOptionalInt(req.query.season_number, undefined);
  const episode_number = parseOptionalInt(req.query.episode_number, undefined);
  const parent_imdb_id = parseOptionalInt(req.query.parent_imdb_id, undefined);
  const parent_tmdb_id = parseOptionalInt(req.query.parent_tmdb_id, undefined);
  const imdb_id = parseOptionalInt(req.query.imdb_id, undefined);
  const tmdb_id = parseOptionalInt(req.query.tmdb_id, undefined);

  try {
    logger.info('quote_search.request', {
      media: m,
      quote: q,
      languages,
      limit,
      forceRebuild,
      maxSubtitleFiles,
      season_number,
      episode_number,
      parent_imdb_id,
      parent_tmdb_id,
      imdb_id,
      tmdb_id,
    });
    const { folder, key, manifest, rebuilt } = await ensureQuoteIndex({
      client: osClient,
      query: m,
      languages,
      season_number,
      episode_number,
      parent_imdb_id,
      parent_tmdb_id,
      imdb_id,
      tmdb_id,
      maxSubtitleFiles,
      forceRebuild,
    });

    const matches = await searchSimilarQuotes({ folder, quote: q, limit });

    logger.info('quote_search.response', {
      media: m,
      cache_key: key,
      rebuilt,
      matches: matches.length,
    });
    res.json({
      status: 'success',
      media: m,
      quote: q,
      index: {
        cache_key: key,
        cues_indexed: manifest?.cueCount,
        subtitle_files: manifest?.fileCount,
        rebuilt,
      },
      matches,
    });
  } catch (e) {
    console.error('Quote search error:', e);
    const message = e instanceof Error ? e.message : String(e);
    logger.error('quote_search.error', { media: String(media ?? ''), quote: String(quote ?? ''), message });
    res.status(500).json({ detail: message });
  }
});

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Subtitle API listening on http://0.0.0.0:${PORT}`);
  logger.info('server.started', { port: PORT });
});
