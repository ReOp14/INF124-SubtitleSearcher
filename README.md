# INF124-SubtitleSearcher
Subtitle Searcher Project for INF 124 - Internet Applications 

## To run the front end: 
Step 1: (First time running the react project)
cd react-subtitlesearcher
npm install
Note: Do not do "npm audit fix", it will break things.

Step 2: (Start front-end server)
cd react-subtitlesearcher
npm start 

Step 3: (Launch in web browser!)
http://localhost:3000/

Optional Step 4: (if desiring to build)
cd react-subtitlesearcher
npm run build

## To run the backend (Node.js):
Requires [Node.js 18+](https://nodejs.org/) (includes `fetch`).

Step 1: Copy environment variables
cd api-subtitlesearcher
Copy `.env.example` to `.env` and fill in your OpenSubtitles API credentials (`OS_API_KEY`, `OS_USERNAME`, `OS_PASSWORD`, `OS_USER_AGENT`).

Step 2: Install dependencies (first time only)
npm install

Step 3: Start the API server
npm start

Optional: during development you can use `npm run dev` to restart automatically when files change (Node `--watch`).

Step 4: Verify
http://localhost:8000/ — should return JSON with a welcome message for the API  
http://localhost:8000/api/subtitles?query=Inception — sample subtitle lines (requires valid `.env` credentials)

The server listens on `0.0.0.0` and port `8000` by default. Override the port with `PORT` in `.env` or the environment if needed.