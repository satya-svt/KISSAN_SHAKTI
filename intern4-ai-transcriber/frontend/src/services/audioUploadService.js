/**
 * audioUploadService.js
 * Handles sending raw audio blobs to the FastAPI backend.
 * Includes compression checks and retry logic for slow connections.
 *
 * Intern 4 - AI Voice (Transcriber) | KissanShakti
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Max chunk size before we warn about bandwidth (2 MB)
const MAX_CHUNK_SIZE_BYTES = 2 * 1024 * 1024;

// Retry config for slow/unreliable connections
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

/**
 * Checks if the audio blob is within acceptable size limits.
 * Logs a warning if the chunk is large (poor compression or long interval).
 */
function checkCompression(blob, mimeType) {
  if (blob.size > MAX_CHUNK_SIZE_BYTES) {
    console.warn(
      `[AudioUpload] Chunk size ${(blob.size / 1024).toFixed(1)} KB exceeds recommended limit. ` +
        `Consider reducing CHUNK_INTERVAL_MS or ensuring opus codec is used. Current MIME: ${mimeType}`
    );
  }
}

/**
 * Sleep helper for retry delays.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * uploadAudioChunk
 * Sends a single audio blob chunk to POST /audio/chunk
 *
 * @param {Blob} audioBlob - Raw audio data
 * @param {string} sessionId - Unique recording session identifier
 * @param {number} chunkIndex - Sequential index of this chunk
 * @param {string} mimeType - MIME type of the audio blob
 * @returns {Promise<{partial_transcript?: string}>}
 */
export async function uploadAudioChunk(audioBlob, sessionId, chunkIndex, mimeType) {
  // File compressor check: warn if chunk is too large
  checkCompression(audioBlob, mimeType);

  const formData = new FormData();
  formData.append("audio", audioBlob, `chunk_${chunkIndex}.webm`);
  formData.append("session_id", sessionId);
  formData.append("chunk_index", String(chunkIndex));
  formData.append("mime_type", mimeType);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/audio/chunk`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      console.warn(`[AudioUpload] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt); // exponential-ish backoff
      }
    }
  }

  throw new Error(`uploadAudioChunk failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

/**
 * finalizeUpload
 * Signals the backend that recording is complete.
 * Backend assembles all chunks and runs full transcription.
 *
 * @param {string} sessionId
 * @returns {Promise<{transcript: string, language?: string}>}
 */
export async function finalizeUpload(sessionId) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/audio/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      console.warn(`[FinalizeUpload] Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw new Error(`finalizeUpload failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
