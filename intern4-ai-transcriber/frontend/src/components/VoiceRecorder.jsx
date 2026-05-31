/**
 * VoiceRecorder.jsx
 * UI component for the AI Voice Transcriber feature.
 * Uses the useAudioRecorder hook to capture and transcribe farmer voice input.
 *
 * Intern 4 - AI Voice (Transcriber) | KissanShakti
 */

import React from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

export default function VoiceRecorder() {
  const { isRecording, transcript, error, startRecording, stopRecording } = useAudioRecorder();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎙️ KissanShakti Voice Input</h2>
      <p style={styles.subtitle}>Speak in your language — we'll convert it to text</p>

      {/* Mic button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          ...styles.micButton,
          backgroundColor: isRecording ? "#c0392b" : "#27ae60",
        }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? "⏹ Stop" : "🎤 Start Recording"}
      </button>

      {/* Recording indicator */}
      {isRecording && (
        <p style={styles.recordingIndicator} role="status" aria-live="polite">
          ● Recording... speak clearly
        </p>
      )}

      {/* Error display */}
      {error && (
        <p style={styles.error} role="alert">
          ⚠️ {error}
        </p>
      )}

      {/* Transcript output */}
      {transcript && (
        <div style={styles.transcriptBox} aria-label="Transcription result">
          <h3 style={styles.transcriptLabel}>Transcript:</h3>
          <p style={styles.transcriptText}>{transcript}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    padding: "24px",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    fontFamily: "sans-serif",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    color: "#1a5c2a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  micButton: {
    padding: "14px 32px",
    fontSize: 16,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  recordingIndicator: {
    marginTop: 12,
    color: "#c0392b",
    fontWeight: "bold",
    animation: "pulse 1s infinite",
  },
  error: {
    marginTop: 12,
    color: "#c0392b",
    fontSize: 14,
  },
  transcriptBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f0f7f0",
    borderRadius: 8,
    textAlign: "left",
  },
  transcriptLabel: {
    fontSize: 14,
    color: "#1a5c2a",
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 1.6,
  },
};
