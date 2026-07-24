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
    video_id = extract_video_id(video_url)

    if not video_id:
        return {"error": "Invalid YouTube URL"}

    try:
        yt_api = YouTubeTranscriptApi()

        try:
            transcript_list = yt_api.fetch(
                video_id,
                languages=['en', 'en-US', 'en-GB', 'a.en']
            )
        except Exception as e:
            print(f"ENGLISH ERROR: {type(e).__name__}: {e}")

            try:
                transcript_list = yt_api.fetch(
                    video_id,
                    languages=['hi', 'a.hi']
                )
            except Exception as e:
                print(f"HINDI ERROR: {type(e).__name__}: {e}")

                try:
                    transcript_list = yt_api.fetch(video_id)
                except Exception as e:
                    print(f"DEFAULT ERROR: {type(e).__name__}: {e}")
                    return {
                        "error": f"{type(e).__name__}: {str(e)}"
                    }

        texts = []
        timestamps = []

        for item in transcript_list:
            if isinstance(item, dict):
                text = item.get("text", "")
                start = item.get("start", 0)
            else:
                text = item.text
                start = item.start

            texts.append(text)
            timestamps.append({
                "text": text,
                "start": start
            })

        return {
            "text": " ".join(texts),
            "timestamps": timestamps
        }

    except Exception as e:
        print(f"GENERAL TRANSCRIPT ERROR: {type(e).__name__}: {e}")
        return {
            "error": f"{type(e).__name__}: {str(e)}"
        }