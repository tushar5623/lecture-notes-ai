# services/transcript.py — REPLACE your existing file with this

import re
import os
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import GenericProxyConfig

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
        proxy_url = (
            f"http://{os.getenv('PROXY_USERNAME')}:"
            f"{os.getenv('PROXY_PASSWORD')}@"
            f"{os.getenv('PROXY_HOST')}:"
            f"{os.getenv('PROXY_PORT')}"
        )

        print(
            "Proxy configured:",
            os.getenv("PROXY_HOST"),
            os.getenv("PROXY_PORT"),
            os.getenv("PROXY_USERNAME")
        )

        proxy_config = GenericProxyConfig(
            http_url=proxy_url,
            https_url=proxy_url
        )

        yt_api = YouTubeTranscriptApi(
            proxy_config=proxy_config
        )

        transcript_list = yt_api.fetch(
            video_id,
            languages=['hi']
        )

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
        print(f"TRANSCRIPT ERROR: {type(e).__name__}: {e}")

        return {
            "error": f"{type(e).__name__}: {str(e)}"
        }