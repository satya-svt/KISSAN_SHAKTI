"""
session_store.py
Manages temporary storage of audio chunks per recording session.
Chunks are saved to /tmp/kissanshakti_audio/<session_id>/ and assembled
into a single file when finalize is called.

Intern 4 - AI Voice (Transcriber) | KissanShakti
"""

import os
import glob
import logging

logger = logging.getLogger(__name__)

TEMP_DIR = os.path.join(os.getenv("TEMP", "/tmp"), "kissanshakti_audio")


def _session_dir(session_id: str) -> str:
    return os.path.join(TEMP_DIR, session_id)


def save_chunk(session_id: str, chunk_index: int, data: bytes) -> str:
    """
    Saves a single audio chunk to disk.
    Returns the path where the chunk was saved.
    """
    session_path = _session_dir(session_id)
    os.makedirs(session_path, exist_ok=True)

    chunk_path = os.path.join(session_path, f"chunk_{chunk_index:04d}.webm")
    with open(chunk_path, "wb") as f:
        f.write(data)

    logger.debug(f"[SessionStore] Saved chunk {chunk_index} for session {session_id} ({len(data)} bytes)")
    return chunk_path


def assemble_session(session_id: str) -> str | None:
    """
    Concatenates all chunks in order into a single audio file.
    Returns the path to the assembled file, or None if no chunks exist.
    """
    session_path = _session_dir(session_id)
    if not os.path.isdir(session_path):
        return None

    chunk_files = sorted(glob.glob(os.path.join(session_path, "chunk_*.webm")))
    if not chunk_files:
        return None

    assembled_path = os.path.join(session_path, "assembled.webm")
    with open(assembled_path, "wb") as out:
        for chunk_file in chunk_files:
            with open(chunk_file, "rb") as f:
                out.write(f.read())

    total_size = os.path.getsize(assembled_path)
    logger.info(
        f"[SessionStore] Assembled {len(chunk_files)} chunks for session {session_id} "
        f"→ {total_size / 1024:.1f} KB"
    )
    return assembled_path


def cleanup_session(session_id: str):
    """
    Removes all temp files for a session after transcription is complete.
    """
    import shutil
    session_path = _session_dir(session_id)
    if os.path.isdir(session_path):
        shutil.rmtree(session_path, ignore_errors=True)
        logger.debug(f"[SessionStore] Cleaned up session {session_id}")
