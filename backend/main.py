from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from datetime import date
import os

from services.transcript import get_transcript
from services.notes import generate_ai_notes, _stop_event, executor
from services.quiz import generate_quiz
from services.flashcards import generate_flashcards
from services.timestamps import generate_timestamps
from services.translate import translate_to_hinglish


load_dotenv()

# ── Shared-key usage tracker (in-memory, resets daily) ──────────────────────
DAILY_LIMIT = 500
_shared_usage = {"count": 0, "date": str(date.today())}

def _increment_shared_usage():
    today = str(date.today())
    if _shared_usage["date"] != today:
        _shared_usage["count"] = 0
        _shared_usage["date"] = today
    _shared_usage["count"] += 1

def _get_shared_usage():
    today = str(date.today())
    if _shared_usage["date"] != today:
        _shared_usage["count"] = 0
        _shared_usage["date"] = today
    return _shared_usage["count"]
# ────────────────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    _stop_event.set()
    executor.shutdown(wait=False, cancel_futures=True)

app = FastAPI(title="Lecture Notes AI Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ───────────────────────────────────────────────────────────
class VideoRequest(BaseModel):
    url: str
    api_key: str | None = None  # user's own Gemini key (optional)

class QuizRequest(BaseModel):
    notes: str
    language: str = "english"
    api_key: str | None = None

class FlashcardRequest(BaseModel):
    notes: str
    language: str = "english"
    api_key: str | None = None

class TimestampRequest(BaseModel):
    transcript: list
    video_url: str
    api_key: str | None = None
# ────────────────────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    notes: str
    api_key: str | None = None

@app.get("/")
def home():
    return {"status": "success", "message": "Backend is running perfectly! 🚀"}


@app.get("/api/usage")
def get_usage():
    """Returns today's shared-key usage so the frontend banner can display it."""
    count = _get_shared_usage()
    return {
        "count": count,
        "limit": DAILY_LIMIT,
        "remaining": max(0, DAILY_LIMIT - count),
        
    }


@app.post("/api/transcript")
def fetch_transcript(request: VideoRequest):
    result = get_transcript(request.url)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "success", "transcript": result["text"]}


@app.post("/api/generate-notes")
async def create_notes(request: VideoRequest):
    transcript_result = get_transcript(request.url)
    if "error" in transcript_result:
        return {"status": "error", "message": transcript_result["error"]}

    transcript_text = transcript_result["text"]
    transcript_timestamps = transcript_result.get("timestamps", [])

    # Track shared-key usage only when the user hasn't provided their own key
    if not request.api_key:
        _increment_shared_usage()

    result = await generate_ai_notes(transcript_text, user_api_key=request.api_key)
    if "error" in result:
        return {"status": "error", "message": result["error"]}

    return {
        "status": "success",
        "notes": result["notes"],
        "transcript_timestamps": transcript_timestamps,
    }


@app.post("/api/generate-quiz")
def create_quiz(request: QuizRequest):
    if not request.api_key:
        _increment_shared_usage()

    result = generate_quiz(request.notes, request.language, user_api_key=request.api_key)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "success", "questions": result["questions"]}


@app.post("/api/generate-flashcards")
def create_flashcards(request: FlashcardRequest):
    if not request.api_key:
        _increment_shared_usage()

    result = generate_flashcards(request.notes, request.language, user_api_key=request.api_key)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "success", "cards": result["cards"]}


@app.post("/api/generate-timestamps")
def create_timestamps(request: TimestampRequest):
    if not request.api_key:
        _increment_shared_usage()

    result = generate_timestamps(request.transcript, request.video_url, user_api_key=request.api_key)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "success", "timestamps": result["timestamps"]}

@app.post("/api/translate-notes")
def translate_notes(request: TranslateRequest):
    result = translate_to_hinglish(request.notes, request.api_key)
    if "error" in result:
        return {"status": "error", "message": result["error"]}
    return {"status": "success", "notes": result["notes"]}
