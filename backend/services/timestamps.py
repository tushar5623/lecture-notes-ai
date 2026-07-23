# services/timestamps.py
from google import genai
import os
import json
import re
import time
from dotenv import load_dotenv

load_dotenv(override=True)

MODEL = "gemini-2.5-flash-lite"


def get_client(user_api_key: str | None = None):
    key = user_api_key or os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=key)


def generate_with_retry(prompt, client, max_retries=5):
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(model=MODEL, contents=prompt)
            return response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                wait_time = 65
                match = re.search(r'seconds["\s:]+(\d+)', error_str)
                if match:
                    wait_time = int(match.group(1)) + 5
                print(f"Timestamps rate limit! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                wait_time = 15 * (attempt + 1)
                print(f"Timestamps 503! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")


def generate_timestamps(transcript_with_timestamps: list, video_url: str, user_api_key: str | None = None):
    try:
        if not transcript_with_timestamps:
            return {"error": "No transcript data with timestamps available"}

        client = get_client(user_api_key)

        sampled = []
        last_time = -30
        for item in transcript_with_timestamps:
            start = item.get('start', 0)
            if start - last_time >= 30:
                sampled.append(f"[{int(start)}s] {item.get('text', '')}")
                last_time = start

        sampled = sampled[:150]
        transcript_text = "\n".join(sampled)

        prompt = f"""You are analyzing a YouTube lecture transcript with timestamps.
Each line shows [seconds] followed by the text spoken at that time.

Identify 10-15 key topic changes or important moments in this lecture.
For each, pick the EXACT second from the transcript where that topic starts.

STRICT JSON FORMAT — return ONLY this JSON, no extra text, no markdown:
{{
  "timestamps": [
    {{
      "topic": "Brief topic name (5-8 words max)",
      "seconds": 45
    }}
  ]
}}

Rules:
- Use the EXACT second number from the transcript lines
- Topics should be meaningful (not "Introduction" unless it's truly distinct)
- Order by time (earliest first)
- seconds must be an integer

Transcript:
{transcript_text}
"""

        raw = generate_with_retry(prompt, client)
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()

        data = json.loads(raw)
        timestamps = data.get("timestamps", [])

        if not timestamps:
            return {"error": "No timestamps generated"}

        valid = []
        for t in timestamps:
            try:
                valid.append({
                    "topic": str(t["topic"]),
                    "seconds": int(t["seconds"])
                })
            except (KeyError, ValueError):
                continue

        return {"timestamps": valid}

    except json.JSONDecodeError as e:
        return {"error": f"Timestamp format error: {str(e)}"}
    except Exception as e:
        return {"error": f"Timestamps generate nahi ho paye: {str(e)}"}
