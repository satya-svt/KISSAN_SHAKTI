# KissanShakthi — AI Intent Parser: Final Handoff Specification
## Day 10 Deliverable | Intern 5 (AI Intent Parser)

---

## 1. MODULE OVERVIEW

**Module Name**: KissanShakthi AI Intent Parser  
**Version**: 1.0.0  
**Owner**: Intern 5 — AI Intent Parser  
**Coordinates With**: Intern 1 (Frontend UI), Intern 3 (Backend Sync API), Intern 4 (Voice Transcriber)

### What This Module Does

The AI Intent Parser is the **"brain" of the voice-first system**. It sits between:
- **Intern 4's Transcriber** → which converts microphone audio → text
- **Intern 1's Frontend** → which consumes structured JSON to auto-fill forms and navigate screens

```
[Farmer Voice] → [Intern 4: Transcriber] → [Intern 5: Intent Parser] → [Intern 1: Frontend Forms]
                                                       ↕
                                             [Google Gemini API]
```

---

## 2. FILE MANIFEST

| File | Purpose | Day Delivered |
|------|---------|---------------|
| `intent-parser.js` | Core parser module — main API | Day 1–7 |
| `prompts/system-prompt.md` | Master Gemini system prompt | Day 1–2 |
| `prompts/variable-extraction-prompt.md` | Variable extraction rules | Day 3–4 |
| `prompts/output-schema.json` | Enforced JSON output schema | Day 4–5 |
| `prompts/routing-map.json` | Voice → UI route mappings | Day 6–7 |
| `prompts/fallback-rules.md` | Fallback handling specification | Day 7 |
| `tests/test-cases.json` | 20 mock test cases | Day 9 |
| `tests/accuracy-report.md` | Accuracy audit template | Day 9–10 |
| `index.html` | Interactive demo + live tester | Day 8–10 |
| `docs/handoff-spec.md` | This document | Day 10 |

---

## 3. INTEGRATION CONTRACT

### 3.1 Input Contract (from Intern 4 — Voice Transcriber)

```javascript
// How Intern 4 calls the parser:
const parserResult = await KissanShakthiParser.parseIntent(
  transcribedText,   // string — plain text output from voice transcription
  GEMINI_API_KEY     // string — Gemini API key (stored as env variable)
);
```

**Input Requirements**:
- `transcribedText`: Plain UTF-8 string, max 500 characters
- Must be raw text output — no audio blobs or binary data
- Regional language transliteration is supported (Hinglish, Marathi-English, etc.)

### 3.2 Output Contract (to Intern 1 — Frontend UI)

The parser ALWAYS returns this exact shape:

```javascript
{
  intent: "POST_JOB",           // string — classified intent code
  confidence: 0.94,             // float — 0.0 to 1.0
  variables: {                  // extracted data fields
    crop_type: "wheat",
    worker_count: 8,
    start_date: "2025-07-10",
    end_date: null,
    duration_days: 5,
    location: "Nashik",
    wage_per_day: 400,
    worker_skill: null,
    equipment_type: null,
    navigate_target: null,
    query_text: null
  },
  routing: {
    screen: "/post-job",        // route to navigate to
    prefill: {                  // React form state keys (Intern 1's naming)
      cropType: "wheat",
      workersNeeded: 8,
      startDate: "2025-07-10",
      endDate: null,
      durationDays: 5,
      location: "Nashik",
      wagePerDay: 400,
      workerSkill: null,
      equipmentType: null,
      searchQuery: null
    }
  },
  fallback: {
    triggered: false,           // true → show clarification prompt
    missing_fields: [],
    clarification_prompt: null  // bilingual string if triggered
  },
  raw_input: "I need 8 workers...",
  metadata: { ... }
}
```

### 3.3 Frontend Integration Example (Intern 1)

```javascript
// In your React component after receiving voice transcript:
import { KissanShakthiParser } from '../intent-parser.js';

async function handleVoiceTranscript(transcript) {
  const result = await KissanShakthiParser.parseIntent(transcript, process.env.GEMINI_API_KEY);

  if (result.fallback.triggered) {
    // Show clarification prompt to farmer
    showClarificationDialog(result.fallback.clarification_prompt);
    // Still prefill whatever was extracted
    prefillForm(result.routing.prefill);
    return;
  }

  // Navigate to the correct screen
  router.push(result.routing.screen);

  // Prefill form fields
  setFormState(result.routing.prefill);
}
```

### 3.4 Backend Sync Contract (Intern 3)

The parser result should be logged by the backend for audit trails:

```javascript
// POST /api/intent-logs
{
  intent: result.intent,
  confidence: result.confidence,
  raw_input: result.raw_input,
  timestamp: result.metadata.timestamp,
  fallback_triggered: result.fallback.triggered,
  farmer_id: currentUser.id   // add from session
}
```

---

## 4. SUPPORTED INTENTS SUMMARY

| Intent Code | Screen Route | Description |
|-------------|-------------|-------------|
| `POST_JOB` | `/post-job` | Farmer posts a labor job |
| `SEARCH_WORKERS` | `/workers` | Search for nearby available workers |
| `REGISTER_WORKER` | `/register-worker` | Laborer registers their profile |
| `VIEW_LISTINGS` | `/jobs` | View all job postings |
| `CHECK_STATUS` | `/bookings` | Check booking/application status |
| `NAVIGATE` | *(dynamic)* | Navigate to a specific screen |
| `EQUIPMENT_RENT` | `/equipment` | Rent farming equipment |
| `ADVISORY` | `/advisory` | Get farming advice |
| `UNKNOWN` | `/` | Unclear — triggers fallback |

---

## 5. API REQUIREMENTS

- **API**: Google Gemini 1.5 Flash
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Authentication**: API key via query parameter `?key=YOUR_KEY`
- **Free Tier Limit**: 15 requests/minute, 1 million tokens/day (sufficient for Phase 1)
- **Get API Key**: https://aistudio.google.com/app/apikey

### Environment Variable Setup
```bash
# .env file (never commit this)
GEMINI_API_KEY=your_key_here
```

---

## 6. ERROR HANDLING

| Error Type | Behavior |
|-----------|----------|
| Empty/noisy input | Immediate local fallback (no API call) |
| API key invalid | Returns fallback with error note |
| Network timeout | Returns fallback with connectivity message |
| Malformed JSON from model | Re-attempts JSON extraction, then fallback |
| Input > 500 chars | Truncated to 500 chars before sending |

---

## 7. KNOWN LIMITATIONS (Phase 1)

1. **No session memory**: Each parse is stateless — context from previous messages is not retained
2. **Date resolution**: Relative dates ("next Monday") resolved at call time — may drift slightly in edge cases
3. **Tamil/Telugu/Odia**: Limited support — model may have lower accuracy for these languages
4. **Compound requests**: Only the primary intent is extracted — "post a job AND register as worker" picks the first
5. **Offline operation**: Parser requires internet for Gemini API calls — cannot function offline

---

## 8. PHASE 2 RECOMMENDATIONS

- [ ] Implement conversation history (multi-turn intent refinement)
- [ ] Add Tamil, Telugu, Odia vocabulary to system prompt
- [ ] Fine-tune a smaller model on KissanShakthi-specific training data
- [ ] Build an offline fallback classifier using TensorFlow.js
- [ ] Implement response caching for repeated identical queries
- [ ] Add confidence calibration via Platt scaling on real usage data

---

## 9. HANDOFF CHECKLIST

- [x] `intent-parser.js` — Core module complete
- [x] `prompts/system-prompt.md` — Intent classification prompt
- [x] `prompts/variable-extraction-prompt.md` — Variable extraction rules
- [x] `prompts/output-schema.json` — JSON output schema
- [x] `prompts/routing-map.json` — Voice → route mapping
- [x] `prompts/fallback-rules.md` — Fallback handling rules
- [x] `tests/test-cases.json` — 20 test cases
- [x] `tests/accuracy-report.md` — Accuracy audit template
- [x] `index.html` — Interactive demo page
- [x] `docs/handoff-spec.md` — This document
- [ ] Accuracy evaluation run completed (fill in accuracy-report.md)
- [ ] Intern 1 integration verified (form prefill working)
- [ ] Intern 3 logging endpoint connected
- [ ] Tech Lead review and sign-off

---

*KissanShakthi Phase 1 — Intern 5 AI Intent Parser — Handoff Complete*
