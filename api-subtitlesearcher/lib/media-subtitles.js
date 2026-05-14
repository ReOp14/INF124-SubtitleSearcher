/**
 * Collect subtitle files from OpenSubtitles search (paginated) and build archives.
 */

/**
 * @param {import('./os-types.js').SubtitleSearchRow} row
 * @param {string} [fallbackQuery]
 */
export function episodeLabelFromRow(row, fallbackQuery = '') {
  const fd = row.attributes?.feature_details;
  if (!fd) {
    return fallbackQuery || 'unknown';
  }
  const season = fd.season_number;
  const episode = fd.episode_number;
  const title = fd.title || fd.movie_name || '';
  if (season != null && episode != null) {
    const s = String(season).padStart(2, '0');
    const e = String(episode).padStart(2, '0');
    return title ? `S${s}E${e} — ${title}` : `S${s}E${e}`;
  }
  return title || fd.movie_name || fallbackQuery || 'movie';
}

/**
 * @param {string} name
 */
export function safeFilenamePart(name) {
  return String(name)
    .replace(/[<>:"/\\|?*]+/g, '_')
    .replace(/\s+/g, '.')
    .slice(0, 120);
}

/**
 * @typedef {object} CollectedFile
 * @property {number} fileId
 * @property {string} episodeLabel
 * @property {string} [releaseName]
 */

/**
 * @param {{ searchSubtitles: (p: object) => Promise<import('./os-types.js').SubtitleSearchResponse> }} client
 * @param {object} opts
 * @param {string} opts.query
 * @param {string} [opts.languages]
 * @param {number} [opts.season_number]
 * @param {number} [opts.episode_number]
 * @param {number} [opts.parent_imdb_id]
 * @param {number} [opts.parent_tmdb_id]
 * @param {number} [opts.imdb_id]
 * @param {number} [opts.tmdb_id]
 * @param {number} opts.maxFiles
 * @returns {Promise<CollectedFile[]>}
 */
export async function collectSubtitleFiles(client, opts) {
  const {
    query,
    languages = 'en',
    season_number,
    episode_number,
    parent_imdb_id,
    parent_tmdb_id,
    imdb_id,
    tmdb_id,
    maxFiles,
  } = opts;

  /** @type {Map<number, CollectedFile>} */
  const byFileId = new Map();

  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && byFileId.size < maxFiles) {
    const searchParams = {
      query,
      languages,
      page,
      ...(season_number !== undefined && { season_number }),
      ...(episode_number !== undefined && { episode_number }),
      ...(parent_imdb_id !== undefined && { parent_imdb_id }),
      ...(parent_tmdb_id !== undefined && { parent_tmdb_id }),
      ...(imdb_id !== undefined && { imdb_id }),
      ...(tmdb_id !== undefined && { tmdb_id }),
    };

    const data = await client.searchSubtitles(searchParams);
    const rows = data.data ?? [];
    if (rows.length === 0) break;

    if (typeof data.total_pages === 'number' && data.total_pages > 0) {
      totalPages = data.total_pages;
    } else {
      totalPages = page;
    }

    for (const row of rows) {
      if (byFileId.size >= maxFiles) break;
      const file = row.attributes?.files?.[0];
      if (!file?.file_id) continue;
      if (byFileId.has(file.file_id)) continue;
      byFileId.set(file.file_id, {
        fileId: file.file_id,
        episodeLabel: episodeLabelFromRow(row, query),
        releaseName: file.file_name,
      });
    }

    page += 1;
  }

  return [...byFileId.values()];
}
