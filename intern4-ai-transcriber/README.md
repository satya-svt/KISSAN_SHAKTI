# Intern 4 — AI Voice (Transcriber) | KissanShakti

**Branch:** `feature/ai-audio-transcriber`

## What this does

Integrates browser MediaRecorder API with a FastAPI backend to:

1. **Capture** microphone audio in the browser using `MediaRecorder`
2. **Stream** compressed audio chunks (opus/webm) to the backend every 3 seconds
3. **Transcribe** audio using OpenAI Whisper (primary) or faster-whisper locally (fallback)
4. **Format** transcripts — strips noise artifacts, normalizes text
5. **Support** regional Indian languages (Telugu, Hindi, Kannada, Tamil, etc.)

---

## Project Structure

```
intern4-ai-transcriber/
├── frontend/
│   ├── src/
│   │   ├── components/VoiceRecorder.jsx   # UI component
│   │   ├── hooks/useAudioRecorder.js      # MediaRecorder integration
│   │   └── services/audioUploadService.js # Chunk upload + retry logic
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── backend/
    ├── main.py                            # FastAPI app entry point
    ├── requirements.txt
    ├── app/
    │   ├── routers/audio.py               # /audio/chunk + /audio/finalize endpoints
    │   ├── services/
    │   │   ├── transcriber.py             # Whisper primary + local fallback
    │   │   └── session_store.py           # Chunk storage & assembly
    │   └── utils/
    │       └── text_formatter.py          # Noise stripping + text cleanup
```

---

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Add your OPENAI_API_KEY
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` — click **Start Recording**, speak, click **Stop**.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/audio/chunk` | Receive a raw audio chunk |
| POST | `/audio/finalize` | Assemble chunks + return transcript |
| GET | `/health` | Health check |

---

## Transcription Backends

| Backend | When used | Languages |
|---------|-----------|-----------|
| OpenAI Whisper API | `OPENAI_API_KEY` is set | 99 languages |
| faster-whisper (local) | API unreachable / no key | Same models, offline |

Set `TRANSCRIBER_LANGUAGE` in `.env` to hint the language (default: `te` for Telugu).

---

## Pipeline Latency Notes

- Audio chunks use **opus codec** (webm) — ~8x smaller than raw PCM
- Chunks are sent every **3 seconds** for near-real-time partial transcripts
- Retry logic: up to **3 attempts** with exponential backoff on slow connections
- Compression check warns if chunk > 2 MB (indicates codec fallback to PCM)
