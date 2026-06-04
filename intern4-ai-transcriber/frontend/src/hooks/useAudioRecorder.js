/**
 * useAudioRecorder.js
 * Custom React hook that integrates the browser MediaRecorder API
 * to capture microphone audio and stream chunks to the backend.
 *
 * Intern 4 - AI Voice (Transcriber) | KissanShakti
 */

import { useState, useRef, useCallback } from "react";
import { uploadAudioChunk, finalizeUpload } from "../services/audioUploadService";

const CHUNK_INTERVAL_MS = 3000; // send a chunk every 3 seconds
const PREFERRED_MIME = "audio/webm;codecs=opus"; // compressed by default in modern browsers
const FALLBACK_MIME = "audio/ogg;codecs=opus";

/**
 * Picks the best supported MIME type for recording.
 * Prefers opus-encoded webm for bandwidth efficiency.
 */
function getSupportedMimeType() {
  if (MediaRecorder.isTypeSupported(PREFERRED_MIME)) return PREFERRED_MIME;
  if (MediaRecorder.isTypeSupported(FALLBACK_MIME)) return FALLBACK_MIME;
  return ""; // browser default
}

/**
 * useAudioRecorder
 *
 * Returns:
 *  - isRecording: boolean
 *  - transcript: string (accumulated transcription text)
 *  - error: string | null
 *  - startRecording(): void
 *  - stopRecording(): void
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const sessionIdRef = useRef(null);
  const chunkIndexRef = useRef(0);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    chunkIndexRef.current = 0;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      // Generate a session ID so the backend can reassemble chunks
      sessionIdRef.current = `session_${Date.now()}`;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          try {
            const result = await uploadAudioChunk(
              event.data,
              sessionIdRef.current,
              chunkIndexRef.current,
              mimeType || "audio/webm"
            );
            chunkIndexRef.current += 1;

            // Append partial transcript if backend returns one
            if (result?.partial_transcript) {
              setTranscript((prev) => prev + " " + result.partial_transcript);
            }
          } catch (uploadErr) {
            console.error("Chunk upload failed:", uploadErr);
            // Non-fatal: keep recording, retry logic is in the service layer
          }
        }
      };

      mediaRecorder.onerror = (e) => {
        setError(`MediaRecorder error: ${e.error?.message || "unknown"}`);
        stopRecording();
      };

      // Start recording; fire ondataavailable every CHUNK_INTERVAL_MS
      mediaRecorder.start(CHUNK_INTERVAL_MS);
      setIsRecording(true);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found on this device.");
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop all mic tracks to release the browser mic indicator
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);

    // Tell backend the session is complete so it can run final transcription
    if (sessionIdRef.current) {
      try {
        const finalResult = await finalizeUpload(sessionIdRef.current);
        if (finalResult?.transcript) {
          setTranscript(finalResult.transcript);
        }
      } catch (err) {
        console.error("Finalize upload failed:", err);
      }
    }
  }, []);

  return { isRecording, transcript, error, startRecording, stopRecording };
}
