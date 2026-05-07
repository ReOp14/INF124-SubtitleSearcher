import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { LocalIndex } from 'vectra';

import { collectSubtitleFiles, safeFilenamePart } from './media-subtitles.js';
import { parseSrt, formatSrtTime } from './srt.js';
import { embedText, embedTexts } from './embeddings.js';
import { createLogger } from './logger.js';

const logger = createLogger({ app: 'api-subtitlesearcher' });

/**
 * @param {object} params
 */
export function indexCacheKey(params) {
  const h = createHash('sha256');
  h.update(JSON.stringify(params));
  return h.digest('hex').slice(0, 32);
}

/**
 * @param {string} baseDir
 * @param {string} key
 */
function indexFolder(baseDir, key) {
  return path.join(baseDir, key);
}

/**
 * @typedef {object} Manifest
 * @property {string} version
 * @property {object} searchParams
 * @property {number} cueCount
 * @property {number} fileCount
 * @property {number} updatedAt
 */

/**
 * @param {object} searchParams
 * @param {import('./media-subtitles.js').CollectedFile[]} files
 * @param {{ client: ReturnType<import('./os-client.js').createOpenSubtitlesClient> }} ctx
 */
async function buildIndexFromSubtitles(searchParams, files, ctx) {
  const { client } = ctx;
  const baseDir =
    process.env.QUOTE_INDEX_DIR ||
    path.join(process.cwd(), 'data', 'quote-indices');
  const key = indexCacheKey(searchParams);
  const folder = indexFolder(baseDir, key);
  logger.info('quote_index.folder_ready', { folder, key });
  await mkdir(folder, { recursive: true });

  const index = new LocalIndex(folder);
  if (await index.isIndexCreated()) {
    logger.info('quote_index.delete_existing', { folder, key });
    await index.deleteIndex();
  }
  logger.info('quote_index.create', { folder, key });
  await index.createIndex({ version: 1 });

  /** @type {{ id: string, vector: number[], metadata: Record<string, string | number> }[]} */
  const batch = [];
  const textsForBatch = [];

  let cueCount = 0;
  let downloadedFiles = 0;
  let parsedFiles = 0;
  /** @type {{ fileId: number, episodeLabel?: string, message: string }[]} */
  const downloadFailures = [];

  for (const f of files) {
    let raw;
    try {
      logger.info('quote_index.subtitle_download_start', {
        fileId: f.fileId,
        episodeLabel: f.episodeLabel,
        releaseName: f.releaseName,
      });
      raw = await client.downloadSubtitleText(f.fileId);
      downloadedFiles += 1;
      logger.info('quote_index.subtitle_download_ok', {
        fileId: f.fileId,
        bytes: Buffer.byteLength(raw, 'utf8'),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      logger.warn('quote_index.subtitle_download_failed', {
        fileId: f.fileId,
        episodeLabel: f.episodeLabel,
        message,
      });
      downloadFailures.push({ fileId: f.fileId, episodeLabel: f.episodeLabel, message });
      continue;
    }
    const cues = parseSrt(raw);
    parsedFiles += 1;
    const ep = safeFilenamePart(f.episodeLabel);

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      const id = randomUUID();
      textsForBatch.push(cue.text);
      batch.push({
        id,
        vector: [],
        metadata: {
          episode: f.episodeLabel,
          episode_key: ep,
          start_ms: cue.startMs,
          end_ms: cue.endMs,
          text: cue.text,
        },
      });
      cueCount += 1;
    }
  }

  if (downloadedFiles === 0) {
    const hint =
      downloadFailures.some((f) => /quota|download.*limit|too many/i.test(f.message))
        ? ' (likely OpenSubtitles download quota exceeded)'
        : '';
    throw new Error(
      `All subtitle downloads failed${hint}. Tried ${files.length} file(s). Last error: ${
        downloadFailures.at(-1)?.message ?? 'unknown error'
      }`,
    );
  }

  if (cueCount === 0) {
    throw new Error(
      `No subtitle cues were parsed (downloaded ${downloadedFiles}/${files.length}, parsed ${parsedFiles}). Refusing to cache an empty quote index.`,
    );
  }

  logger.info('quote_index.embedding_start', {
    key,
    folder,
    subtitle_files_total: files.length,
    subtitle_files_downloaded: downloadedFiles,
    subtitle_files_parsed: parsedFiles,
    cues_total: cueCount,
  });
  const vectors = await embedTexts(textsForBatch, 24);
  logger.info('quote_index.embedding_done', { key, vectors: vectors.length });
  for (let i = 0; i < batch.length; i++) {
    batch[i].vector = vectors[i];
  }

  if (batch.length > 0) {
    logger.info('quote_index.insert_start', { key, items: batch.length });
    await index.batchInsertItems(batch);
    logger.info('quote_index.insert_done', { key, items: batch.length });
  }

  /** @type {Manifest} */
  const manifest = {
    version: '1',
    searchParams,
    cueCount,
    fileCount: files.length,
    updatedAt: Date.now(),
  };
  logger.info('quote_index.manifest_write', {
    key,
    path: path.join(folder, 'manifest.json'),
    cueCount,
    fileCount: files.length,
  });
  await writeFile(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  return { folder, key, manifest };
}

/**
 * @param {object} searchParams
 * @param {Manifest} manifest
 */
function manifestMatches(searchParams, manifest) {
  return JSON.stringify(manifest.searchParams) === JSON.stringify(searchParams);
}

/**
 * @param {object} opts
 * @param {ReturnType<import('./os-client.js').createOpenSubtitlesClient>} opts.client
 * @param {string} opts.query
 * @param {string} [opts.languages]
 * @param {number} [opts.season_number]
 * @param {number} [opts.episode_number]
 * @param {number} [opts.parent_imdb_id]
 * @param {number} [opts.parent_tmdb_id]
 * @param {number} [opts.imdb_id]
 * @param {number} [opts.tmdb_id]
 * @param {number} opts.maxSubtitleFiles
 * @param {boolean} [opts.forceRebuild]
 */
export async function ensureQuoteIndex(opts) {
  const {
    client,
    query,
    languages = 'en',
    season_number,
    episode_number,
    parent_imdb_id,
    parent_tmdb_id,
    imdb_id,
    tmdb_id,
    maxSubtitleFiles,
    forceRebuild = false,
  } = opts;

  const searchParams = {
    query,
    languages,
    ...(season_number !== undefined && { season_number }),
    ...(episode_number !== undefined && { episode_number }),
    ...(parent_imdb_id !== undefined && { parent_imdb_id }),
    ...(parent_tmdb_id !== undefined && { parent_tmdb_id }),
    ...(imdb_id !== undefined && { imdb_id }),
    ...(tmdb_id !== undefined && { tmdb_id }),
    maxSubtitleFiles,
  };

  const baseDir =
    process.env.QUOTE_INDEX_DIR ||
    path.join(process.cwd(), 'data', 'quote-indices');
  const key = indexCacheKey(searchParams);
  const folder = indexFolder(baseDir, key);
  const manifestPath = path.join(folder, 'manifest.json');

  if (!forceRebuild) {
    try {
      const raw = await readFile(manifestPath, 'utf8');
      const manifest = /** @type {Manifest} */ (JSON.parse(raw));
      const idx = new LocalIndex(folder);
      if (
        manifest.cueCount > 0 &&
        manifestMatches(searchParams, manifest) &&
        (await idx.isIndexCreated())
      ) {
        logger.info('quote_index.cache_hit', { key, folder });
        return { folder, key, manifest, rebuilt: false };
      }
      if (manifestMatches(searchParams, manifest) && manifest.cueCount === 0) {
        logger.warn('quote_index.cache_invalid_empty', { key, folder });
      }
    } catch {
      /* build */
    }
  }

  logger.info('quote_index.cache_miss', { key, folder, forceRebuild });
  const files = await collectSubtitleFiles(client, {
    query,
    languages,
    season_number,
    episode_number,
    parent_imdb_id,
    parent_tmdb_id,
    imdb_id,
    tmdb_id,
    maxFiles: maxSubtitleFiles,
  });

  if (files.length === 0) {
    throw new Error('No subtitle files found to index for this media query.');
  }

  const { manifest } = await buildIndexFromSubtitles(searchParams, files, { client });
  return { folder, key, manifest, rebuilt: true };
}

/**
 * Deduplicate by exact `text` match, keeping the best-scoring instance.
 * @param {ReturnType<typeof searchSimilarQuotes> extends Promise<infer T> ? T : never} matches
 * @param {number} limit
 */
function dedupeMatchesByText(matches, limit) {
  /** @type {Map<string, any>} */
  const bestByText = new Map();
  for (const m of matches) {
    const key = String(m.text ?? '');
    if (!bestByText.has(key)) {
      bestByText.set(key, m);
      continue;
    }
    const prev = bestByText.get(key);
    if (Number(m.score) > Number(prev.score)) {
      bestByText.set(key, m);
    }
  }
  return [...bestByText.values()].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, limit);
}

/**
 * @param {object} opts
 * @param {string} opts.folder
 * @param {string} opts.quote
 * @param {number} opts.limit
 */
export async function searchSimilarQuotes(opts) {
  const { folder, quote, limit } = opts;
  const index = new LocalIndex(folder);
  if (!(await index.isIndexCreated())) {
    throw new Error('Quote index is missing.');
  }
  const qv = await embedText(quote);
  // Pull extra so we can dedupe by exact `text` while still returning up to `limit`.
  const requested = Math.max(1, Math.min(limit, 50));
  const fetchN = Math.min(Math.max(requested * 5, requested), 200);
  logger.info('quote_search.query', { folder, requested_limit: requested, fetch: fetchN });
  const results = await index.queryItems(qv, quote, fetchN, undefined, false);

  const mapped = results.map((r) => {
    const md = r.item.metadata;
    const startMs = Number(md.start_ms);
    const endMs = Number(md.end_ms);
    return {
      score: r.score,
      timestamp_start: formatSrtTime(startMs),
      timestamp_end: formatSrtTime(endMs),
      timestamp_start_ms: startMs,
      timestamp_end_ms: endMs,
      episode: String(md.episode ?? ''),
      text: String(md.text ?? ''),
    };
  });

  const deduped = dedupeMatchesByText(mapped, requested);
  logger.info('quote_search.results', {
    requested_limit: requested,
    raw: mapped.length,
    deduped: deduped.length,
  });
  return deduped;
}
