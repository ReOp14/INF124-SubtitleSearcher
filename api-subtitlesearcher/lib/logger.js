import path from 'path';
import { mkdir, appendFile } from 'fs/promises';
 
function isoDateUtc(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
 
function logFilePath(logDir, d = new Date()) {
  return path.join(logDir, `server-${isoDateUtc(d)}.log`);
}
 
/**
 * Lightweight JSONL logger.
 * Writes to data/logs/server-YYYY-MM-DD.log by default.
 *
 * @param {object} [opts]
 * @param {string} [opts.logDir]
 * @param {string} [opts.app]
 */
export function createLogger(opts = {}) {
  const logDir =
    opts.logDir ||
    process.env.SERVER_LOG_DIR ||
    path.join(process.cwd(), 'data', 'logs');
  const app = opts.app || 'api-subtitlesearcher';
 
  /** @type {Promise<void>} */
  let chain = Promise.resolve();
 
  /**
   * @param {'debug'|'info'|'warn'|'error'} level
   * @param {string} event
   * @param {Record<string, unknown>} [data]
   */
  function log(level, event, data = {}) {
    const entry = {
      ts: new Date().toISOString(),
      level,
      app,
      event,
      ...data,
    };
 
    chain = chain
      .then(async () => {
        await mkdir(logDir, { recursive: true });
        await appendFile(logFilePath(logDir), JSON.stringify(entry) + '\n', 'utf8');
      })
      .catch(() => {
        // Best-effort logging; never break server flow.
      });
  }
 
  return {
    log,
    debug: (event, data) => log('debug', event, data),
    info: (event, data) => log('info', event, data),
    warn: (event, data) => log('warn', event, data),
    error: (event, data) => log('error', event, data),
  };
}

