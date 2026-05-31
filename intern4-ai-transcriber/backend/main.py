"""
main.py
FastAPI entry point for the KissanShakti AI Voice Transcriber backend.

Intern 4 - AI Voice (Transcriber) | KissanShakti
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import audio

app = FastAPI(
    title="KissanShakti Voice Transcriber API",
    description="Receives microphone audio chunks from the browser and returns transcriptions.",
    version="1.0.0",
)

# Allow requests from the Vite dev server and production PWA origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://kissanshakti.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio.router, prefix="/audio", tags=["Audio Transcription"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "voice-transcriber"}
