"""
translator.py
Post-transcription translation service.
Translates transcribed text from source language to a target language.

Primary use case: Telugu (farmer's speech) → Hindi (wider accessibility)

Intern 4 - AI Voice (Transcriber) | KissanShakti
"""

import logging
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

# Supported language pairs for KissanShakti
SUPPORTED_LANGUAGES = {
    "te": "Telugu",
    "hi": "Hindi",
    "kn": "Kannada",
    "ta": "Tamil",
    "mr": "Marathi",
    "en": "English",
}


def translate_text(text: str, source_lang: str = "te", target_lang: str = "hi") -> str:
    """
    Translates text from source_lang to target_lang.
    Default: Telugu → Hindi

    Args:
        text: The transcribed text to translate
        source_lang: ISO language code of source (default 'te' = Telugu)
        target_lang: ISO language code of target (default 'hi' = Hindi)

    Returns:
        Translated text string
    """
    if not text or not text.strip():
        return ""

    if source_lang == target_lang:
        return text  # No translation needed

    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        logger.info(
            f"[Translator] {SUPPORTED_LANGUAGES.get(source_lang, source_lang)} → "
            f"{SUPPORTED_LANGUAGES.get(target_lang, target_lang)}: '{text[:40]}...'"
        )
        return translated
    except Exception as e:
        logger.error(f"[Translator] Translation failed: {e}")
        return text  # Return original if translation fails
