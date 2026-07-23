import os
from dotenv import load_dotenv
from google import genai

# API key load karo
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

client = genai.Client(api_key=api_key)

print("🔍 Searching for available models...\n")

# Bina kisi filter ke saare models print karo
try:
    for model in client.models.list():
        print(f"✅ Model Name: {model.name}")
except Exception as e:
    print(f"Error aayi: {e}")