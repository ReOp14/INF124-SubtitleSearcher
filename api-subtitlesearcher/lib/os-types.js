/**
 * @typedef {object} SubtitleSearchAttributes
 * @property {{ file_id: number, file_name?: string }[]} files
 * @property {object} [feature_details]
 * @property {string} [feature_details.feature_type]
 * @property {string} [feature_details.movie_name]
 * @property {string} [feature_details.title]
 * @property {number} [feature_details.season_number]
 * @property {number} [feature_details.episode_number]
 * @property {number} [feature_details.imdb_id]
 * @property {number} [feature_details.tmdb_id]
 * @property {number} [feature_details.parent_imdb_id]
 * @property {number} [feature_details.parent_tmdb_id]
 *
 * @typedef {object} SubtitleSearchRow
 * @property {string} id
 * @property {string} type
 * @property {SubtitleSearchAttributes} attributes
 *
 * @typedef {object} SubtitleSearchResponse
 * @property {SubtitleSearchRow[]} [data]
 * @property {number} [total_pages]
 * @property {number} [total_count]
 * @property {number} [page]
 */

export {};
