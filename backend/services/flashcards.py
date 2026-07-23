# services/flashcards.py
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
                print(f"Flashcard rate limit! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                wait_time = 15 * (attempt + 1)
                print(f"Flashcard 503! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")


def generate_flashcards(notes_text: str, language: str = "english", user_api_key: str | None = None):
    try:
        client = get_client(user_api_key)

        lang_instruction = (
            "Generate all flashcard content in HINDI language."
            if language == "hindi"
            else "Generate all flashcard content in ENGLISH language."
        )

        prompt = f"""You are an expert study assistant for students.
Based on the lecture notes below, generate exactly 12 flashcards for studying.

{lang_instruction}

STRICT JSON FORMAT — return ONLY this JSON, no extra text, no markdown backticks:
{{
  "cards": [
    {{
      "id": 1,
      "front": "Term or question on the front of the card",
      "back": "Clear explanation or answer on the back of the card"
    }}
  ]
}}

Rules:
- Generate exactly 12 cards
- Front should be a key term, concept, or short question
- Back should be a clear, concise explanation (2-4 sentences max)
- Cover the most important concepts from the notes
- Cards should be self-contained and make sense alone
- Do NOT use markdown formatting in front or back text

Lecture Notes:
{notes_text[:8000]}
"""

        raw = generate_with_retry(prompt, client)
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()

        data = json.loads(raw)
        cards = data.get("cards", [])
        if not cards:
            raise ValueError("No flashcards generated")

        return {"cards": cards}

    except json.JSONDecodeError as e:
        return {"error": f"Flashcard format error: {str(e)}"}
    except Exception as e:
        return {"error": f"Flashcards generate nahi ho paye: {str(e)}"}
