# services/translate.py
# Copy this to backend/services/translate.py

from google import genai
import os
import re
import time
from dotenv import load_dotenv

load_dotenv(override=True)
MODEL = "gemini-2.5-flash-lite"

def get_client(user_api_key=None):
    key = user_api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise Exception("No API key available")
    return genai.Client(api_key=key)

def generate_with_retry(client, prompt, max_retries=5):
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
                print(f"Translate rate limit! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            elif "503" in error_str or "UNAVAILABLE" in error_str:
                wait_time = 15 * (attempt + 1)
                print(f"Translate 503! Waiting {wait_time}s... (attempt {attempt+1})")
                time.sleep(wait_time)
            else:
                raise e
    raise Exception("Max retries exceeded")

def translate_to_hinglish(notes_text: str, user_api_key: str = None):
    """Convert English notes to Hinglish (Hindi + English mix)"""
    try:
        client = get_client(user_api_key)

        prompt = f"""You are an expert at converting English educational notes into Hinglish.

Hinglish means: Write in a natural mix of Hindi and English the way Indian students actually talk and study.

RULES:
- Keep ALL technical terms, concepts, formulas, and code in English (e.g. "Array", "Binary Tree", "CPU", "RAM")
- Keep all headings in English but add a short Hindi explanation in brackets after them
- Convert explanations and descriptions to Hinglish
- Write Hindi words in Roman script (not Devanagari) — e.g. "yeh", "matlab", "isliye", "basically", "samajh lo", "dhyan raho"
- Keep ALL Markdown formatting exactly the same (##, -, **, etc.)
- Keep bullet points structure completely intact
- Sound natural like an Indian teacher explaining to students
- Do NOT translate code blocks at all

EXAMPLE of good Hinglish conversion:
English: "A binary tree is a data structure where each node has at most two children."
Hinglish: "Binary tree ek aisa data structure hai jisme har node ke maximum do children hote hain."

English: "## Time Complexity"
Hinglish: "## Time Complexity (Kitna time lagega?)"

English: "- The process starts in the New state when it is first created."
Hinglish: "- Process pehli baar create hone par New state mein start hota hai."

Now convert these notes to Hinglish. Keep all Markdown formatting exactly as is:

{notes_text}"""

        result = generate_with_retry(client, prompt)
        return {"notes": result}

    except Exception as e:
        return {"error": f"Translation fail ho gayi: {str(e)}"}
