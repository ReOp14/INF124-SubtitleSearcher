/**
 * OpenSubtitles.com REST API client.
 *
 * TV episodes: per official docs (Search for subtitles), use `season_number` and
 * `episode_number` together with a show identifier — typically `query` (show name)
 * and/or `parent_imdb_id` / `parent_tmdb_id` so results map to the correct series.
 * @see https://opensubtitles.stoplight.io/docs/opensubtitles-api/a172317bd5ccc-search-for-subtitles
 */

/**
 * @param {Record<string, string | undefined>} env
 * @param {{ enqueue: <T>(fn: () => Promise<T>) => Promise<T> }} queue
 */
export function createOpenSubtitlesClient(env, queue) {
  const API_KEY = env.OS_API_KEY;
  const USERNAME = env.OS_USERNAME;
  const PASSWORD = env.OS_PASSWORD;
  const USER_AGENT = env.OS_USER_AGENT ?? '';

  /** @type {string | null} */
  let jwtToken = null;
  /** @type {string} */
  let apiBase = 'https://api.opensubtitles.com';

  function baseHeaders() {
    return {
      'Api-Key': API_KEY,
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  async function authenticate() {
    if (!USERNAME || !PASSWORD || !API_KEY) {
      throw new Error('Missing credentials! Check your .env file.');
    }
    const loginUrl = 'https://api.opensubtitles.com/api/v1/login';
    const resp = await fetch(loginUrl, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Failed to authenticate. OpenSubtitles says: ${text}`);
    }
    const data = await resp.json();
    const host = data.base_url || 'api.opensubtitles.com';
    apiBase = host.startsWith('http') ? host : `https://${host}`;
    jwtToken = data.token;
    return jwtToken;
  }

  /**
   * @param {Record<string, string>} headers
   */
  async function authorizedHeaders(headers) {
    if (!jwtToken) {
      await authenticate();
    }
    return { ...headers, Authorization: `Bearer ${jwtToken}` };
  }

  /**
   * @param {string} pathWithQuery
   * @param {{ method?: string, body?: object }} [opts]
   */
  async function apiFetch(pathWithQuery, opts = {}) {
    const method = opts.method ?? 'GET';
    let headers = await authorizedHeaders(baseHeaders());
    const url = `${apiBase}${pathWithQuery}`;

    let resp = await fetch(url, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (resp.status === 401) {
      jwtToken = null;
      headers = await authorizedHeaders(baseHeaders());
      resp = await fetch(url, {
        method,
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    }

    return resp;
  }

  /**
   * @param {Record<string, string | number | undefined | null>} raw
   */
  function buildSubtitleSearchParams(raw) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) {
      if (v === undefined || v === null || v === '') continue;
      p.set(k, String(v));
    }
    return p;
  }

  /**
   * @typedef {object} SearchSubtitleParams
   * @property {string} query
   * @property {string} [languages]
   * @property {number} [season_number] - TV: season (use with episode_number).
   * @property {number} [episode_number] - TV: episode.
   * @property {number} [parent_imdb_id]
   * @property {number} [parent_tmdb_id]
   * @property {number} [imdb_id]
   * @property {number} [tmdb_id]
   * @property {number} [page]
   */

  /**
   * @param {SearchSubtitleParams} params
   */
  async function searchSubtitles(params) {
    const { page = 1, ...rest } = params;
    const qp = buildSubtitleSearchParams({ ...rest, page });
    const resp = await apiFetch(`/api/v1/subtitles?${qp.toString()}`);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenSubtitles search error ${resp.status}: ${text}`);
    }
    return /** @type {Promise<import('./os-types.js').SubtitleSearchResponse>} */ (resp.json());
  }

  /**
   * @param {number} fileId
   */
  async function downloadSubtitleText(fileId) {
    const resp = await apiFetch('/api/v1/download', {
      method: 'POST',
      body: { file_id: fileId },
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenSubtitles download error ${resp.status}: ${text}`);
    }
    const dlData = await resp.json();
    const link = dlData.link;
    if (!link) {
      throw new Error('Failed to get download link.');
    }
    const subResp = await fetch(link);
    if (!subResp.ok) {
      throw new Error('Failed to download the subtitle file.');
    }
    return subResp.text();
  }

  /**
   * @param {string} query
   * @param {number} [sampleLines]
   */
  async function fetchSubtitleSample(query, sampleLines = 15) {
    const searchData = await searchSubtitles({ query, languages: 'en', page: 1 });
    if (!searchData.data?.length) {
      throw new Error('No subtitles found for the given query.');
    }
    let fileId;
    try {
      fileId = searchData.data[0].attributes.files[0].file_id;
    } catch {
      throw new Error('Failed to parse subtitle file ID from response.');
    }
    const text = await downloadSubtitleText(fileId);
    const lines = text.split(/\r?\n/);
    return lines.slice(0, sampleLines).join('\n');
  }

  return {
    searchSubtitles: (params) => queue.enqueue(() => searchSubtitles(params)),
    downloadSubtitleText: (fileId) => queue.enqueue(() => downloadSubtitleText(fileId)),
    fetchSubtitleSample: (query, sampleLines) =>
      queue.enqueue(() => fetchSubtitleSample(query, sampleLines)),
  };
}
