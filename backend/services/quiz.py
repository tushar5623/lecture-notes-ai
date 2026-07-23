# services/quiz.py
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
                print(f"Quiz rate limit! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                wait_time = 15 * (attempt + 1)
                print(f"Quiz 503! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")


def generate_quiz(notes_text: str, language: str = "english", user_api_key: str | None = None):
    try:
        client = get_client(user_api_key)

        lang_instruction = (
            "Generate all questions and options in HINDI language."
            if language == "hindi"
            else "Generate all questions and options in ENGLISH language."
        )

        prompt = f"""You are an expert quiz maker for students.
Based on the lecture notes below, generate exactly 10 multiple choice questions.

{lang_instruction}

STRICT JSON FORMAT — return ONLY this JSON, no extra text, no markdown backticks:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Brief explanation why this is correct."
    }}
  ]
}}

Rules:
- "correct" is the INDEX (0-3) of the correct option in the options array
- Each question must have exactly 4 options
- Questions should cover different topics from the notes
- Make questions clear and unambiguous
- Explanation should be 1-2 sentences

Lecture Notes:
{notes_text[:8000]}
"""

        raw = generate_with_retry(prompt, client)
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*', '', raw)
        raw = re.sub(r'\s*```$', '', raw)
        raw = raw.strip()

        data = json.loads(raw)
        questions = data.get("questions", [])
        if not questions:
            raise ValueError("No questions generated")

        return {"questions": questions}

    except json.JSONDecodeError as e:
        return {"error": f"Quiz format error: {str(e)}"}
    except Exception as e:
        return {"error": f"Quiz generate nahi ho paya: {str(e)}"}
