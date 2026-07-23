# services/transcript.py — REPLACE your existing file with this

import re
from youtube_transcript_api import YouTubeTranscriptApi

def extract_video_id(url: str):
    """YouTube URL se 11-character ka video ID nikalta hai"""
    regex = r'(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})'
    match = re.search(regex, url)
    if match:
        return match.group(1)
    return None

def get_transcript(video_url: str):
    """
    Returns:
    {
      "text": "full transcript as string",
      "timestamps": [{"text": "...", "start": 12.3}, ...]  ← raw data with timing
    }
    """
    video_id = extract_video_id(video_url)

    if not video_id:
        return {"error": "Invalid YouTube URL"}

    try:
        yt_api = YouTubeTranscriptApi()

        # Try languages in priority order
        try:
            transcript_list = yt_api.fetch(video_id, languages=['en', 'en-US', 'en-GB', 'a.en'])
        except Exception:
            try:
                transcript_list = yt_api.fetch(video_id, languages=['hi', 'a.hi'])
            except Exception:
                transcript_list = yt_api.fetch(video_id)

        texts = []
        timestamps = []

        for item in transcript_list:
            if isinstance(item, dict):
                text = item.get('text', '')
                start = item.get('start', 0)
            else:
                text = item.text
                start = item.start

            texts.append(text)
            timestamps.append({
                "text": text,
                "start": start
            })

        full_transcript = " ".join(texts)

        return {
            "text": full_transcript,
            "timestamps": timestamps   # ← NEW: raw timestamp data
        }

    except Exception as e:
        return {"error": f"Transcript nahi mil paya: {str(e)}"}
