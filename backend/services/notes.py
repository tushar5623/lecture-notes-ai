from google import genai
from google.genai import types
import os
import time
import re
import threading
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv

load_dotenv(override=True)

MODEL = "gemini-2.5-flash"

# Gemini 2.5 Flash has "thinking" turned on by default, and thinking tokens are
# drawn from the SAME output budget as the visible answer. Left unset, longer/
# more complex transcripts push more of that budget into invisible "thinking"
# and less into the actual notes — sometimes exhausting it entirely and
# returning an empty response. For this task (restructuring a transcript into
# notes) thinking doesn't add much, so we disable it and give the model the
# full output ceiling instead.
MAX_OUTPUT_TOKENS = 65536
GENERATION_CONFIG = types.GenerateContentConfig(
    max_output_tokens=MAX_OUTPUT_TOKENS,
    thinking_config=types.ThinkingConfig(thinking_budget=0),
)

_stop_event = threading.Event()
executor = ThreadPoolExecutor(max_workers=2)


def get_client(user_api_key: str | None = None):
    key = user_api_key or os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=key)


# Chunk size in characters. This used to be 800,000 — big enough that almost
# any lecture (even 9-10 hours) was sent as a SINGLE giant prompt. That made
# long lectures the worst case for the thinking-budget problem above (more
# material to reason over -> more of the budget spent thinking) with no
# chunking safety net. Chunking earlier keeps notes detail roughly constant
# per hour of lecture instead of collapsing as the transcript grows.
def chunk_text(text: str, chunk_size=150000):
    words = text.split()
    chunks, current_chunk, current_length = [], [], 0
    for word in words:
        current_chunk.append(word)
        current_length += len(word) + 1
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk, current_length = [], 0
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks


def generate_with_retry(prompt, client, max_retries=5):
    for attempt in range(max_retries):
        if _stop_event.is_set():
            raise Exception("Server shutting down")
        try:
            response = client.models.generate_content(
                model=MODEL, contents=prompt, config=GENERATION_CONFIG
            )

            text = (response.text or "").strip()

            # Guard against a starved/blocked response instead of silently
            # returning empty or truncated notes. finish_reason tells us why
            # generation stopped even when .text comes back empty.
            finish_reason = None
            candidates = getattr(response, "candidates", None) or []
            if candidates:
                finish_reason = getattr(candidates[0], "finish_reason", None)

            if not text:
                raise Exception(
                    f"Empty response from Gemini (finish_reason={finish_reason}). "
                    "This usually means the chunk was blocked (safety/recitation) "
                    "or the model ran out of output budget."
                )

            if finish_reason is not None and "MAX_TOKENS" in str(finish_reason) and len(text) < 200:
                raise Exception(
                    "Response was cut off almost immediately by MAX_TOKENS — "
                    "the output budget was exhausted before real content was written."
                )

            return text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                wait_time = 65
                match = re.search(r'seconds["\s:]+(\d+)', error_str)
                if match:
                    wait_time = int(match.group(1)) + 5
                print(f"Rate limit! Waiting {wait_time}s... (attempt {attempt+1})")
                for _ in range(wait_time):
                    if _stop_event.is_set():
                        raise Exception("Server shutting down")
                    time.sleep(1)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                wait_time = 15 * (attempt + 1)
                print(f"503 Server busy! Waiting {wait_time}s... (attempt {attempt+1})")
                for _ in range(wait_time):
                    if _stop_event.is_set():
                        raise Exception("Server shutting down")
                    time.sleep(1)
            else:
                raise e
    raise Exception("Max retries exceeded — Gemini server busy hai, baad mein try karo")


def _generate_blocking(transcript_text: str, user_api_key: str | None = None):
    try:
        client = get_client(user_api_key)
        text_chunks = chunk_text(transcript_text)
        total_chunks = len(text_chunks)
        print(f"Total chunks: {total_chunks}")

        if total_chunks == 1:
            prompt = f"""You are an expert academic assistant.
The transcript may be in Hindi or English or mixed.
SPECIAL INSTRUCTIONS FOR CODING CONTENT:
- If the instructor describes or reads out code, reconstruct it into proper code blocks
- Use triple backticks with the language name (```python, ```java, etc.)
- Infer the programming language from context
- If variable names, function names or logic is mentioned verbally, format them as code
Write comprehensive notes in ENGLISH only using Markdown.
Use ## for headings, - for bullets.
Translate any Hindi content to English naturally.
Include all key concepts, facts, and a final ## Summary section.


Transcript:
{text_chunks[0]}"""
            return {"notes": generate_with_retry(prompt, client)}

        all_notes = []
        previous_summary = ""

        for i, chunk in enumerate(text_chunks):
            if _stop_event.is_set():
                raise Exception("Server shutting down")

            print(f"Processing chunk {i+1}/{total_chunks}...")
            is_last = (i == total_chunks - 1)
            context = f"\nCONTEXT FROM PREVIOUS SECTIONS:\n{previous_summary}\n" if previous_summary else ""

            prompt = f"""You are an expert academic assistant. Part {i+1} of {total_chunks}.
{context}
INSTRUCTIONS:
- Write notes in ENGLISH using Markdown (## headings, - bullets)
- Extract key concepts, facts, examples
- No filler words
- End with INTERNAL_SUMMARY: (2-3 lines of what was covered)
{"- Also write a final '## Overall Summary' section." if is_last else ""}

Transcript Part {i+1}:
{chunk}"""

            response_text = generate_with_retry(prompt, client)

            if "INTERNAL_SUMMARY:" in response_text:
                parts = response_text.split("INTERNAL_SUMMARY:")
                all_notes.append(parts[0].strip())
                previous_summary = parts[1].strip()
            else:
                all_notes.append(response_text)
                previous_summary = f"Part {i+1} processed."

            if not is_last:
                print(f"Waiting 65s for rate limit...")
                for _ in range(65):
                    if _stop_event.is_set():
                        raise Exception("Server shutting down")
                    time.sleep(1)

        return {"notes": "\n\n---\n\n".join(all_notes)}

    except Exception as e:
        return {"error": f"We couldn't generate your notes right now: {str(e)}"}


async def generate_ai_notes(transcript_text: str, user_api_key: str | None = None):
    import asyncio
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, _generate_blocking, transcript_text, user_api_key)
    return result
