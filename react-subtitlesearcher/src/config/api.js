const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

/** @param {string} path Path beginning with `/`, e.g. `/api/subtitles` */
export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

/**
 * @param {string} query
 * @param {{ languages?: string, maxFiles?: number }} [options]
 */
export function subtitleZipUrl(query, { languages = 'en', maxFiles = 1 } = {}) {
  const params = new URLSearchParams({
    query,
    languages,
    max_files: String(maxFiles),
  });
  return apiUrl(`/api/media/subtitles.zip?${params.toString()}`);
}

/**
 * Fetch subtitle ZIP via the API and trigger a browser download.
 * Uses fetch so CRA dev proxy (and production CORS) work reliably; plain
 * anchor navigation to /api/* often receives index.html instead of the file.
 * @param {string} query
 * @param {{ languages?: string, maxFiles?: number }} [options]
 */
export async function downloadSubtitleZip(query, { languages = 'en', maxFiles = 1 } = {}) {
  const response = await fetch(subtitleZipUrl(query, { languages, maxFiles }));

  if (!response.ok) {
    const text = await response.text();
    let detail = response.statusText || 'Download failed';
    try {
      const body = JSON.parse(text);
      detail = body.detail || detail;
    } catch {
      if (text.trim()) detail = text;
    }
    throw new Error(detail);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = `${query.replace(/[^\w.-]+/g, '_')}.subtitles.zip`;
  const match = disposition?.match(/filename="([^"]+)"/);
  if (match?.[1]) filename = match[1];

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
