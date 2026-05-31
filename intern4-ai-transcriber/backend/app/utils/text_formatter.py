"""
text_formatter.py
Post-processing utilities for raw Whisper transcripts.

Tasks:
  1. Strip filler words and background acoustic noise artifacts
  2. Normalize whitespace and punctuation
  3. Apply language-specific formatting for Indian regional languages

Intern 4 - AI Voice (Transcriber) | KissanShakti
"""

import re

# Common acoustic noise artifacts that Whisper sometimes transcribes
NOISE_PATTERNS = [
    r"\[.*?\]",           # [noise], [music], [laughter], etc.
    r"\(.*?\)",           # (inaudible), (crosstalk)
    r"\bum+\b",           # um, umm, ummm
    r"\buh+\b",           # uh, uhh
    r"\bhmm+\b",          # hmm, hmmm
    r"\bah+\b",           # ah, ahh
    r"\boh+\b",           # oh (standalone filler)
    r"\.{3,}",            # ellipsis artifacts ...
    r"♪.*?♪",             # music notes
]

# Compile all noise patterns into one regex for efficiency
_NOISE_RE = re.compile("|".join(NOISE_PATTERNS), re.IGNORECASE)


def strip_noise(text: str) -> str:
    """
    Removes background acoustic noise artifacts from the transcript.
    """
    cleaned = _NOISE_RE.sub("", text)
    # Collapse multiple spaces left by removals
    cleaned = re.sub(r" {2,}", " ", cleaned)
    return cleaned.strip()


def normalize_whitespace(text: str) -> str:
    """
    Normalizes line breaks and extra spaces.
    """
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


def capitalize_sentences(text: str) -> str:
    """
    Capitalizes the first letter of each sentence.
    Works for Latin-script languages (English, transliterated Indian languages).
    """
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(s.capitalize() for s in sentences if s)


def format_transcript(raw_text: str) -> str:
    """
    Full pipeline: noise strip → normalize → capitalize.
    Returns a clean, readable transcript string.
    """
    if not raw_text:
        return ""

    text = strip_noise(raw_text)
    text = normalize_whitespace(text)
    text = capitalize_sentences(text)
    return text
