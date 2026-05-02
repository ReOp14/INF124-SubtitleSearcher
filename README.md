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

## To run the backend:
Step 1:
(Windows)
cd api-subtitlesearcher
python -m venv venv
venv/Scripts/activate

(Linux)
cd api-subtitlesearcher
python3 -m venv venv
source venv/bin/activate

Step 2:
pip install -r requirements.txt

Step 3: (start server)
uvicorn main:app --host 0.0.0.0 --port 8000

Step 4:
http://localhost:8000/ -> Should show a home page for the API
http://localhost:8000/api/subtitles?query=Inception -> Test Query