/**
 * Parse SRT (SubRip) content into timed cues.
 * @param {string} raw
 * @returns {{ startMs: number, endMs: number, text: string }[]}
 */
export function parseSrt(raw) {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  /** @type {{ startMs: number, endMs: number, text: string }[]} */
  const cues = [];
  const blocks = normalized.split(/\n\n+/);

  const timeRe =
    /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.length > 0);
    if (lines.length < 2) continue;

    let timeLineIdx = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      timeLineIdx = 1;
    }
    const timeLine = lines[timeLineIdx];
    const m = timeLine.match(timeRe);
    if (!m) continue;

    const startMs =
      Number(m[1]) * 3600000 +
      Number(m[2]) * 60000 +
      Number(m[3]) * 1000 +
      Number(m[4]);
    const endMs =
      Number(m[5]) * 3600000 +
      Number(m[6]) * 60000 +
      Number(m[7]) * 1000 +
      Number(m[8]);

    const textLines = lines.slice(timeLineIdx + 1);
    const text = textLines
      .join(' ')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!text) continue;

    cues.push({ startMs, endMs, text });
  }

  return cues;
}

/**
 * @param {number} ms
 */
export function formatSrtTime(ms) {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const frac = ms % 1000;
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(frac, 3)}`;
}
