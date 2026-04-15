"""
STT 서비스 — 영업 미팅 녹취 파일을 텍스트로 변환 (OpenAI Whisper)
"""
from openai import OpenAI
from config import settings

client = OpenAI(api_key=settings.openai_api_key)

# Whisper API 지원 포맷
ALLOWED_EXTENSIONS = {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "ogg"}

# Whisper API 파일 크기 상한 (25MB)
MAX_FILE_SIZE = 25 * 1024 * 1024


def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """
    미팅 녹취 오디오 파일을 한국어 텍스트로 변환합니다.

    Args:
        file_bytes: 오디오 파일 바이너리
        filename:   원본 파일명 (확장자 판별용)

    Returns:
        변환된 텍스트
    """
    # OpenAI SDK는 (파일명, 바이트, MIME) 튜플을 허용합니다.
    res = client.audio.transcriptions.create(
        model="whisper-1",
        file=(filename, file_bytes),
        language="ko",
        response_format="text",
    )
    # response_format="text" 인 경우 문자열로 반환됩니다.
    return res if isinstance(res, str) else getattr(res, "text", "")
