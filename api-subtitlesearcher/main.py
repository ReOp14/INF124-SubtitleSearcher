import os
import asyncio
import httpx
import traceback
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

API_KEY = os.getenv("OS_API_KEY")
USERNAME = os.getenv("OS_USERNAME")
PASSWORD = os.getenv("OS_PASSWORD")
USER_AGENT = os.getenv("OS_USER_AGENT")
RATE_LIMIT_DELAY = 2.0 

# Define and create a local directory for subtitles
DOWNLOAD_DIR = "downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Global state for caching the JWT Token
jwt_token = None

class RateLimitedQueue:
    """Queue system to process tasks sequentially with a mandatory delay."""
    def __init__(self, delay: float):
        self.queue = asyncio.Queue()
        self.delay = delay
        self.worker_task = None

    async def worker(self):
        while True:
            future, func, args, kwargs = await self.queue.get()
            try:
                result = await func(*args, **kwargs)
                future.set_result(result)
            except Exception as e:
                future.set_exception(e)
            finally:
                self.queue.task_done()
            
            await asyncio.sleep(self.delay)

    async def enqueue(self, func, *args, **kwargs):
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        await self.queue.put((future, func, args, kwargs))
        return await future

request_queue = RateLimitedQueue(delay=RATE_LIMIT_DELAY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    request_queue.worker_task = asyncio.create_task(request_queue.worker())
    yield
    if request_queue.worker_task:
        request_queue.worker_task.cancel()

app = FastAPI(lifespan=lifespan)

async def authenticate(client: httpx.AsyncClient):
    """Logs into OpenSubtitles and returns a JWT token."""
    if not USERNAME or not PASSWORD or not API_KEY:
        raise Exception("Missing credentials! Check your .env file.")

    login_url = "https://api.opensubtitles.com/api/v1/login"
    payload = {
        "username": USERNAME,
        "password": PASSWORD
    }
    resp = await client.post(login_url, json=payload)
    
    if resp.status_code != 200:
        raise Exception(f"Failed to authenticate. OpenSubtitles says: {resp.text}")
        
    data = resp.json()
    return data.get("token")

async def download_subtitle_file(query: str):
    global jwt_token
    
    headers = {
        "Api-Key": API_KEY,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        # 1. Ensure we have a JWT token
        if not jwt_token:
            jwt_token = await authenticate(client)
            
        # Attach the Bearer token to our client headers for subsequent requests
        client.headers["Authorization"] = f"Bearer {jwt_token}"
        
        # 2. Search for the subtitle
        search_url = "https://api.opensubtitles.com/api/v1/subtitles"
        params = {"query": query, "languages": "en"}
        
        search_resp = await client.get(search_url, params=params)
        
        # If token expired (401), re-authenticate and retry once
        if search_resp.status_code == 401:
            jwt_token = await authenticate(client)
            client.headers["Authorization"] = f"Bearer {jwt_token}"
            search_resp = await client.get(search_url, params=params)

        if search_resp.status_code != 200:
            error_msg = (
                f"Search API error!\n"
                f"HTTP Status Code: {search_resp.status_code}\n"
                f"Response Text: '{search_resp.text}'\n"
                f"Response Headers: {search_resp.headers}"
            )
            raise Exception(error_msg)
            
        search_data = search_resp.json()
        if not search_data.get("data"):
            raise Exception("No subtitles found for the given query.")
            
        try:
            file_id = search_data["data"][0]["attributes"]["files"][0]["file_id"]
        except (KeyError, IndexError):
            raise Exception("Failed to parse subtitle file ID from response.")
            
        # 3. Request a download link
        download_url = "https://api.opensubtitles.com/api/v1/download"
        payload = {"file_id": file_id}
        
        dl_resp = await client.post(download_url, json=payload)
        if dl_resp.status_code != 200:
            raise Exception(f"Download API error: {dl_resp.text}")
            
        dl_data = dl_resp.json()
        link = dl_data.get("link")
        
        if not link:
            raise Exception("Failed to get download link.")
            
        # Determine file name from API response, fallback to <file_id>.srt
        raw_file_name = dl_data.get("file_name") or f"{file_id}.srt"
        # Sanitize file name to prevent directory traversal
        file_name = os.path.basename(raw_file_name) 
            
        # 4. Download the actual subtitle file content
        sub_resp = await client.get(link)
        if sub_resp.status_code != 200:
            raise Exception("Failed to download the subtitle file.")
            
        # 5. Save the file to the local directory
        file_path = os.path.join(DOWNLOAD_DIR, file_name)
        
        # We use "wb" (write binary) to ensure text encoding is preserved correctly
        with open(file_path, "wb") as f:
            f.write(sub_resp.content)
            
        return file_path

@app.get("/")
async def root():
    return {"message": "Subtitle API is running! Go to /api/subtitles?query=Inception to test it."}

@app.get("/api/subtitles")
async def get_subtitles(query: str):
    try:
        # Enqueue the task
        saved_file_path = await request_queue.enqueue(download_subtitle_file, query)
        
        return {
            "status": "success",
            "query": query,
            "saved_to": saved_file_path
        }
    except Exception as e:
        print("\n" + "="*50)
        print("ERROR DOWNLOADING SUBTITLES:")
        traceback.print_exc()
        print("="*50 + "\n")
        raise HTTPException(status_code=500, detail=str(e))