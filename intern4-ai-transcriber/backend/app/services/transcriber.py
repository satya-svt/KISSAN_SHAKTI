"""
transcriber.py
Core transcription service.

Primary:  OpenAI Whisper API (cloud, supports 99 languages including Hindi, Telugu, Kannada)
Fallback: faster-whisper (local CPU model) if primary is unreachable

Intern 4 - AI Voice (Transcriber) | KissanShakti
"""

import os
import io
import logging
import httpx

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
WHISPER_API_URL = "https://api.openai.com/v1/audio/transcriptions"

# Dialect / language hint mapping for regional Indian accents
# Maps common spoken language codes to Whisper language hints
DIALECT_LANGUAGE_MAP = {
    "te": "te",   # Telugu
    "hi": "hi",   # Hindi
    "kn": "kn",   # Kannada
    "ta": "ta",   # Tamil
    "mr": "mr",   # Marathi
    "pa": "pa",   # Punjabi
    "gu": "gu",   # Gujarati
    "bn": "bn",   # Bengali
    "en": "en",   # English
}

# Default language hint — Telugu is primary for KissanShakti's target region
DEFAULT_LANGUAGE = os.getenv("TRANSCRIBER_LANGUAGE", "te")


async def transcribe_audio_file(
    audio_bytes: bytes,
    mime_type: str = "audio/webm",
    partial: bool = False,
) -> str:
    """
    Transcribes audio bytes to text.
    Tries OpenAI Whisper first; falls back to local faster-whisper on failure.

    Args:
        audio_bytes: Raw audio data
        mime_type: MIME type of the audio (e.g. audio/webm)
        partial: If True, uses a faster/lighter model pass for real-time hints

    Returns:
        Transcribed text string
    """
    language = DIALECT_LANGUAGE_MAP.get(DEFAULT_LANGUAGE, DEFAULT_LANGUAGE)

    # Try primary: OpenAI Whisper API
    if OPENAI_API_KEY:
        try:
            return await _transcribe_openai(audio_bytes, mime_type, language, partial)
        except Exception as e:
            logger.warning(f"[Transcriber] OpenAI Whisper failed: {e}. Falling back to local model.")

    # Fallback: local faster-whisper
    return await _transcribe_local(audio_bytes, language)


async def _transcribe_openai(
    audio_bytes: bytes,
    mime_type: str,
    language: str,
    partial: bool,
) -> str:
    """
    Calls the OpenAI Whisper transcription API.
    Uses 'whisper-1' model which handles regional Indian accents well.
    """
    # Determine file extension from mime type
    ext_map = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/wav": "wav",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
    }
    ext = ext_map.get(mime_type.split(";")[0].strip(), "webm")
    filename = f"audio.{ext}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            WHISPER_API_URL,
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            files={"file": (filename, io.BytesIO(audio_bytes), mime_type)},
            data={
                "model": "whisper-1",
                "language": language,
                "response_format": "text",
                # Prompt helps Whisper handle agricultural vocabulary
                "prompt": "Farmer speaking about crops, weather, soil, market prices.",
            },
        )

    if response.status_code != 200:
        raise RuntimeError(f"OpenAI API error {response.status_code}: {response.text}")

    return response.text.strip()


async def _transcribe_local(audio_bytes: bytes, language: str) -> str:
    """
    Fallback transcription using faster-whisper (runs locally on CPU).
    Activated when OpenAI API is unreachable (offline / quota exceeded).
    """
    try:
        from faster_whisper import WhisperModel  # type: ignore

        # Use tiny model for speed on CPU; upgrade to 'base' for better accuracy
        model = WhisperModel("tiny", device="cpu", compute_type="int8")

        # Write bytes to a temp buffer faster-whisper can read
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            segments, info = model.transcribe(tmp_path, language=language)
            transcript = " ".join(seg.text for seg in segments).strip()
            logger.info(f"[LocalTranscriber] Detected language: {info.language} (prob={info.language_probability:.2f})")
            return transcript
        finally:
            os.unlink(tmp_path)

    except ImportError:
        logger.error("[Transcriber] faster-whisper not installed. Install with: pip install faster-whisper")
        raise RuntimeError(
            "No transcription backend available. "
            "Set OPENAI_API_KEY or install faster-whisper."
        )
