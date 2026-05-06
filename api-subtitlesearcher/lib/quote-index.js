import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { LocalIndex } from 'vectra';

import { collectSubtitleFiles, safeFilenamePart } from './media-subtitles.js';
import { parseSrt, formatSrtTime } from './srt.js';
import { embedText, embedTexts } from './embeddings.js';

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
  await mkdir(folder, { recursive: true });

  const index = new LocalIndex(folder);
  if (await index.isIndexCreated()) {
    await index.deleteIndex();
  }
  await index.createIndex({ version: 1 });

  /** @type {{ id: string, vector: number[], metadata: Record<string, string | number> }[]} */
  const batch = [];
  const textsForBatch = [];

  let cueCount = 0;

  for (const f of files) {
    let raw;
    try {
      raw = await client.downloadSubtitleText(f.fileId);
    } catch {
      continue;
    }
    const cues = parseSrt(raw);
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

  const vectors = await embedTexts(textsForBatch, 24);
  for (let i = 0; i < batch.length; i++) {
    batch[i].vector = vectors[i];
  }

  if (batch.length > 0) {
    await index.batchInsertItems(batch);
  }

  /** @type {Manifest} */
  const manifest = {
    version: '1',
    searchParams,
    cueCount,
    fileCount: files.length,
    updatedAt: Date.now(),
  };
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
      if (manifestMatches(searchParams, manifest) && (await idx.isIndexCreated())) {
        return { folder, key, manifest, rebuilt: false };
      }
    } catch {
      /* build */
    }
  }

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
  const results = await index.queryItems(qv, quote, limit, undefined, false);

  return results.map((r) => {
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
}
