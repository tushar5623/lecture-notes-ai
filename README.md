# Lecture Notes AI

Turn YouTube lectures into structured study material with a React frontend, a FastAPI backend, and Google Gemini. Paste a lecture link to generate English notes, then review the material through quizzes, flashcards, Hinglish explanations, and clickable topic timestamps.

The application retrieves existing YouTube captions and processes their text. It does not download videos or transcribe audio.

## Features

- **Structured lecture notes:** Generate Markdown notes with headings, key concepts, examples, and summaries. The single-chunk prompt also requests code blocks for programming content.
- **Hindi and English captions:** Retrieve available captions in Hindi or supported English variants and generate notes in English.
- **Hinglish translation:** Convert notes into a mix of Roman-script Hindi and English while retaining technical terms and Markdown formatting.
- **Practice quizzes:** Request 10 multiple-choice questions with explanations, in English or Hindi.
- **Study flashcards:** Request 12 question-and-answer cards in English or Hindi.
- **Topic navigation:** Generate topic timestamps that link back to relevant moments in the video.
- **Copy and export:** Copy the displayed notes or download the original English notes as Markdown, plain text, PDF, or Word documents.
- **Interface controls:** Switch between light and dark themes and optionally supply a personal Gemini API key for note generation.

## How It Works

```text
YouTube lecture URL
        |
        v
React frontend -> FastAPI backend -> YouTube captions
                        |
                        v
                Gemini note generation
                        |
                        v
              Markdown notes + caption timestamps
                        |
                        v
              Notes displayed in the browser
                        |
          +-------------+----------------+
          |                              |
          v                              v
  Copy / download locally       Additional Gemini requests
                                for quizzes, flashcards,
                                translation, and topics
```

1. The frontend validates a standard YouTube watch URL or `youtu.be` link.
2. The backend extracts the video ID and fetches captions through `youtube-transcript-api`, trying `hi`, `en`, `en-IN`, `en-US`, and `en-GB` in that order.
3. The notes service divides long transcripts into chunks of approximately 150,000 characters and processes them sequentially. A short internal summary carries context between chunks.
4. Gemini returns English Markdown notes. The backend sends those notes and the original caption timestamps to the frontend.
5. Study tools make separate API requests when opened. File exports are generated in the browser.

Note generation runs in a thread pool with two workers. The service waits 65 seconds between transcript chunks and retries selected quota and service-availability errors, so long lectures can take several minutes.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| UI and rendering | Framer Motion, Lucide React, React Markdown, remark-gfm, React Hot Toast |
| HTTP client | Axios |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| AI integration | Google Gen AI SDK (`google-genai`) |
| Caption retrieval | `youtube-transcript-api` |
| Document exports | jsPDF, docx, file-saver |
| Configuration | python-dotenv |

The source currently selects `gemini-2.5-flash` for notes and `gemini-2.5-flash-lite` for quizzes, flashcards, topic timestamps, and translation. Model names are constants in the respective service files.

## Project Structure

```text
lecture-notes-ai/
|-- README.md
|-- .gitignore
|-- backend/
|   |-- main.py                  # FastAPI routes, CORS, and usage tracking
|   |-- requirements.txt         # Pinned Python dependencies
|   |-- check_models.py          # Optional model-listing utility
|   |-- Dockerfile              # Incomplete container setup
|   `-- services/
|       |-- transcript.py        # YouTube URL parsing and caption retrieval
|       |-- notes.py             # Chunking, note generation, and retries
|       |-- quiz.py              # Multiple-choice question generation
|       |-- flashcards.py        # Flashcard generation
|       |-- timestamps.py        # Topic timestamp generation
|       `-- translate.py         # English-to-Hinglish translation
`-- frontend/
    |-- package.json
    |-- package-lock.json
    |-- vite.config.js           # Development port and API proxy
    |-- tailwind.config.js
    |-- Dockerfile              # Frontend development container
    |-- public/
    `-- src/
        |-- App.jsx             # Application state and note-generation flow
        |-- api.js              # Shared Axios client
        |-- main.jsx            # React entry point
        |-- index.css           # Global styles
        `-- components/         # Input, notes, study tools, and UI controls
```

## Local Setup

### Prerequisites

- Python 3.10 or newer, with `pip` and `venv` available; use a version supported by the pinned packages in `backend/requirements.txt`.
- Node.js and npm compatible with the frontend dependencies. The locked Vite package requires Node.js `^18.0.0 || >=20.0.0`.
- A Gemini API key with access to the models configured in the source.
- Internet access for YouTube caption retrieval and Gemini requests.

The commands below start from the project root and use PowerShell.

### 1. Install Backend Dependencies

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The commands use the virtual environment's Python directly, so activating it is optional. On macOS/Linux, use `python3 -m venv .venv` and replace `.\.venv\Scripts\python.exe` with `.venv/bin/python`.

Keep the generated `.venv/` directory out of commits; the current `.gitignore` does not yet exclude it.

### 2. Configure Gemini

Create `backend/.env` with the following content, replacing the placeholder with your own key:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
```

This is the backend's shared key and enables all AI features in the current UI. `.env` files are excluded by the repository's `.gitignore`.

You can also add a personal key through the key button in the frontend. Currently, the UI forwards that key only for note generation; quizzes, flashcards, timestamps, and translation still use the backend's shared key. Direct API clients can supply `api_key` to each AI endpoint.

### 3. Start the Backend

Run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- Health endpoint: [http://localhost:8000](http://localhost:8000)
- Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative API documentation: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 4. Start the Frontend

Open another terminal at the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), or the address printed by Vite if port 3000 is occupied. Keep both terminals running.

### Configuration Reference

| Setting | Location | Current behavior |
| --- | --- | --- |
| Shared Gemini key | `backend/.env` | Read from `GEMINI_API_KEY` |
| Personal key | Frontend key panel / request `api_key` | Overrides the shared key when included in a request |
| Backend URL | `frontend/src/api.js` | Hardcoded to `http://localhost:8000` |
| Frontend development port | `frontend/vite.config.js` | `3000` |
| Development proxy | `frontend/vite.config.js` | `/api` forwards to `http://127.0.0.1:8000` |
| Gemini models | `backend/services/*.py` | Service-level `MODEL` constants |
| Displayed daily usage limit | `backend/main.py` | `DAILY_LIMIT = 500`; informational only |

The Axios client uses an absolute backend URL, so its current requests bypass the Vite proxy. No `VITE_API_URL` environment variable is implemented.

## Using the Application

1. Paste a YouTube lecture URL such as `https://www.youtube.com/watch?v=VIDEO_ID` or `https://youtu.be/VIDEO_ID`, with an actual 11-character video ID.
2. Submit the URL and wait for caption retrieval and note generation.
3. Read the generated notes or use the notes language toggle to request Hinglish translation.
4. Use the header's **EN / HI** control to choose the quiz and flashcard language.
5. Open the quiz, flashcard, or timestamp tools to generate additional study material.
6. Copy the displayed notes or export the original English notes in the desired format.

Notes and study results live in the current browser session's application state and are lost on refresh. Download material you want to keep.

## API Reference

All POST endpoints accept JSON. AI endpoints accept an optional `api_key` string; when omitted, the backend uses `GEMINI_API_KEY`.

| Method | Endpoint | Required fields | Success payload fields |
| --- | --- | --- | --- |
| `GET` | `/` | None | `status`, `message` |
| `GET` | `/api/usage` | None | `count`, `limit`, `remaining` |
| `POST` | `/api/transcript` | `url` | `status`, `transcript` |
| `POST` | `/api/generate-notes` | `url` | `status`, `notes`, `transcript_timestamps` |
| `POST` | `/api/generate-quiz` | `notes` | `status`, `questions` |
| `POST` | `/api/generate-flashcards` | `notes` | `status`, `cards` |
| `POST` | `/api/generate-timestamps` | `transcript`, `video_url` | `status`, `timestamps` |
| `POST` | `/api/translate-notes` | `notes` | `status`, `notes` |

Quiz and flashcard requests also accept `language`, defaulting to `"english"`; use `"hindi"` for Hindi output. Timestamp requests expect `transcript` to be an array of caption objects such as `{"text": "Introduction to arrays", "start": 30}`.

Example note-generation request in PowerShell:

```powershell
$payload = @{ url = 'https://www.youtube.com/watch?v=VIDEO_ID' } | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:8000/api/generate-notes' -Method Post -ContentType 'application/json' -Body $payload
```

Handled service failures return a body like the following, generally with HTTP status `200`; clients must inspect the response body's `status`. FastAPI request-validation errors use standard validation responses.

```json
{
  "status": "error",
  "message": "Invalid YouTube URL"
}
```

## Build and Verification

Build the frontend from `frontend/`:

```powershell
npm run build
npm run preview
```

The build is written to `frontend/dist/`. Preview serves the built frontend at the URL printed in the terminal; the backend must still be running separately.

There is no automated test suite or lint script configured in this repository. A manual smoke check is to open the backend health endpoint, generate notes from a captioned video, try each study tool, and download an export. AI checks require a valid key and make Gemini API requests.

## Current Limitations and Deployment Notes

- **Caption availability:** Videos must expose captions in one of the configured languages. Disabled captions, inaccessible videos, and YouTube request or IP restrictions can prevent retrieval. There is no speech-to-text fallback.
- **Long lectures:** Note requests have a 10-minute frontend timeout. Chunking, inter-chunk waits, and retries can exceed it.
- **Study coverage:** Quizzes and flashcards use only the first 8,000 characters of the notes. Topic generation samples captions at least 30 seconds apart and uses at most 150 samples, so it may omit later sections of long lectures.
- **Generated content:** Question counts and content structure are prompt requests, not strict guarantees. Review generated notes, answers, and reconstructed code against the lecture.
- **Usage tracking:** The displayed 500-request daily limit is not enforced. The counter is held in memory per backend process, resets on restart or a new server-local date, counts selected shared-key endpoint attempts, excludes translation, and does not measure actual Gemini quota or token usage.
- **Data and keys:** There is no database, account system, or saved-note history. A remembered personal key is stored in browser `localStorage`; otherwise it remains in React state. Keys are sent to the backend for the requests that include them, and lecture text or notes are sent to Gemini for processing.
- **Hosting configuration:** The frontend backend URL must be updated for a hosted deployment. CORS currently allows all origins, and the API has no authentication or enforced rate limiting; configure those controls and HTTPS before exposing a shared key publicly.
- **Docker:** Container setup is unfinished. The backend Dockerfile contains an empty `RUN` instruction and no startup command; the frontend Dockerfile starts the Vite development server. Use the local setup above until the container configuration is completed.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Cannot connect to the backend | Confirm Uvicorn is running on port 8000 and `frontend/src/api.js` points to that server. |
| Invalid YouTube URL | Use a standard watch URL or `youtu.be` link. The UI does not accept every YouTube URL format. |
| Transcript retrieval fails | Check caption availability, supported caption languages, video accessibility, and the backend error output. |
| Missing or invalid API key | Check `backend/.env`, restart the backend after changes, and confirm the key can access the configured models. |
| Notes work, but study tools fail with a personal key | Configure `GEMINI_API_KEY` on the backend; the current UI does not forward personal keys to the study tools. |
| Quota errors or slow generation | Check the key's provider quota and backend retry messages. Long transcripts include deliberate waits between chunks. |
| Download is English after switching to Hinglish | Downloads use the original notes. Use Copy to copy the currently displayed Hinglish text. |
| `check_models.py` cannot find a key | That optional utility reads `GOOGLE_API_KEY`, while the application reads `GEMINI_API_KEY`. |

## Contributing

Keep changes focused and document any changes to setup, API payloads, or user-facing behavior. Run the frontend build for frontend changes and exercise affected API routes for backend changes. Do not commit API keys, environment files, virtual environments, or generated build output.

## License

No license file is currently included. Reuse and distribution terms have not been specified by this repository.
