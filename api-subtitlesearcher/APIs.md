# Subtitle Searcher API — testing guide
# - How to run the backend locally
# - Example of running each HTTP endpoint

## Prerequisites
1. **Node.js** 18 or newer (the `vectra` package may recommend a newer Node version; upgrade if you see engine warnings).
2. **Dependencies** installed:
   ```powershell
   cd c:\Git\INF124-SubtitleSearcher\api-subtitlesearcher
   npm install
   ```
3. **Environment variables** in `.env` (same variables the app already expects):
   - `OS_API_KEY` — OpenSubtitles API key  
   - `OS_USERNAME` / `OS_PASSWORD` — OpenSubtitles.com account  
   - `OS_USER_AGENT` — required string, e.g. `MyApp 1.0`  
   Optional tuning:
   - `PORT` — listen port (default **8000**)
   - `OS_RATE_LIMIT_DELAY_MS` — delay between queued OpenSubtitles calls (default **2000**)
   - `MEDIA_SUBTITLE_MAX_FILES` — default cap for bulk ZIP (default **60**)
   - `MEDIA_SUBTITLE_MAX_FILES_CAP` — hard cap (default **200**)
   - `QUOTE_SEARCH_MAX_FILES` — subtitle files used to build the quote index (default **25**)
   - `QUOTE_SEARCH_MAX_FILES_CAP` — hard cap (default **80**)
   - `QUOTE_INDEX_DIR` — where vector indices are stored (default `data/quote-indices` under the process working directory)

## Start the server
From this directory:
```powershell
cd c:\Git\INF124-SubtitleSearcher\api-subtitlesearcher
npm start
```
Or with auto-restart on file changes:
```powershell
npm run dev
```
Default base URL: **`http://localhost:8000`**.
---

## Endpoints overview

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Health + short pointer to other routes |
| `GET` | `/api/subtitles` | First English hit: return a **text sample** of one subtitle file |
| `GET` | `/api/media/subtitles.zip` | Paginated search + **ZIP** of multiple `.srt` files |
| `GET` | `/api/quotes/similar` | **Semantic** quote search (embeddings + Vectra index) |

OpenSubtitles search parameters for TV episodes are documented in the REST docs:  
[Search for subtitles (OpenSubtitles API)](https://opensubtitles.stoplight.io/docs/opensubtitles-api/a172317bd5ccc-search-for-subtitles).

---
## 1. Root — `GET /`
---

## 2. Subtitle sample — `GET /api/subtitles`
Returns a small **plain-text preview** (first lines) of one matching English subtitle from OpenSubtitles.
### Query parameters

| Name | Required | Description |
|------|----------|-------------|
| `query` | Yes | Movie or show search string (passed to OpenSubtitles). |

### Examples

```powershell
curl.exe -s "http://localhost:8000/api/subtitles?query=Inception"
```

```powershell
curl.exe -s "http://localhost:8000/api/subtitles?query=Breaking%20Bad"
```

---

## 3. Bulk download ZIP — `GET /api/media/subtitles.zip`
Streams a **ZIP** of subtitle files. The server deduplicates by OpenSubtitles `file_id`, paginates search results, and respects a **maximum file count**.

### Query parameters

| Name | Required | Description |
|------|----------|-------------|
| `query` | Yes | Movie or show name for OpenSubtitles search. |
| `languages` | No | Language code(s), default `en`. |
| `max_files` | No | Max distinct subtitle files (default from `MEDIA_SUBTITLE_MAX_FILES`, capped by `MEDIA_SUBTITLE_MAX_FILES_CAP`). |
| `season_number` | No | TV season (use with `episode_number` for one episode). |
| `episode_number` | No | TV episode number. |
| `parent_imdb_id` | No | Series IMDb id (disambiguation). |
| `parent_tmdb_id` | No | Series TMDB id. |
| `imdb_id` | No | Title IMDb id. |
| `tmdb_id` | No | Title TMDB id. |

### Examples

**Movie (save ZIP to disk)**

```powershell
curl.exe -s -o "Inception.subtitles.zip" "http://localhost:8000/api/media/subtitles.zip?query=Inception&languages=en&max_files=5"
```

**TV — specific episode (example season 1, episode 1)**

```powershell
curl.exe -s -o "episode.zip" "http://localhost:8000/api/media/subtitles.zip?query=Breaking%20Bad&season_number=1&episode_number=1&languages=en&max_files=10"
```

**Note:** Each file inside the ZIP may take time because downloads are **rate-limited** in the backend.

---

## 4. Similar quotes — `GET /api/quotes/similar`

Builds or reuses a **local vector index** (Vectra + local embeddings) over subtitle cues, then returns the closest lines to your `quote` by **semantic** similarity.

### Query parameters

| Name | Required | Description |
|------|----------|-------------|
| `media` | Yes | Show or movie string used like OpenSubtitles `query` when fetching subtitles. |
| `quote` | Yes | Phrase to search for (similar lines). |
| `limit` | No | Number of matches (default **10**, max **50**). |
| `languages` | No | Default `en`. |
| `max_subtitle_files` | No | How many subtitle **files** to download before indexing (default from `QUOTE_SEARCH_MAX_FILES`). |
| `refresh` | No | `true` or `1` to **rebuild** the index for this media key. |
| `season_number`, `episode_number`, `parent_imdb_id`, `parent_tmdb_id`, `imdb_id`, `tmdb_id` | No | Same meaning as the ZIP endpoint; narrows what gets indexed. |

### Examples

**Movie**
```powershell
curl.exe -s "http://localhost:8000/api/quotes/similar?media=Inception&quote=We%20need%20to%20go%20deeper&limit=5"
```

**TV (narrow to one episode for faster, smaller index)**
```powershell
curl.exe -s "http://localhost:8000/api/quotes/similar?media=Breaking%20Bad&season_number=1&episode_number=1&quote=I%20am%20awake&limit=5"
```

**Force re-index**
```powershell
curl.exe -s "http://localhost:8000/api/quotes/similar?media=Inception&quote=dream&refresh=1&limit=5"
```

**Expected:** `200` with:
- `media`, `quote`
- `index`: `cache_key`, `cues_indexed`, `subtitle_files`, `rebuilt`
- `matches`: array of objects with `score`, `timestamp_start`, `timestamp_end`, `timestamp_start_ms`, `timestamp_end_ms`, `episode`, `text`

**Errors:** `422` if `media` or `quote` is missing; `500` with `detail` on failure.

### First-run behavior
- The **first** request may take noticeably longer: downloading the embedding model, fetching subtitles, parsing SRT, and building the index.
- Later requests with the **same** index key reuse `data/quote-indices/` (unless `refresh` is set).

---
## Quick troubleshooting
| Symptom | Things to check |
|--------|-------------------|
| `Missing credentials` | `.env` has `OS_API_KEY`, `OS_USERNAME`, `OS_PASSWORD`, `OS_USER_AGENT`. |
| Very slow responses | OpenSubtitles queue delay (`OS_RATE_LIMIT_DELAY_MS`) and many `max_files` / large index builds. |
| Quote search out of memory / very large index | Lower `max_subtitle_files` or narrow with `season_number` / `episode_number`. |
