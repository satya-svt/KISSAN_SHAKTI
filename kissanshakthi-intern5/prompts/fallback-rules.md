# Fallback Handling Rules
## Day 7 Deliverable | Intern 5 (AI Intent Parser)

---

## OVERVIEW

Fallback handling ensures the app **never crashes or silently fails** when a farmer's voice input is incomplete, unclear, or in an unexpected format. Instead, it gracefully asks a friendly clarifying question in Hinglish.

---

## WHEN FALLBACK IS TRIGGERED

Fallback is activated under ANY of these conditions:

| Condition | Description |
|-----------|-------------|
| `confidence < 0.6` | AI is not confident enough in the intent classification |
| `intent == "UNKNOWN"` | Input could not be mapped to any known intent |
| Critical fields are ALL null | The required fields for the detected intent are all missing |
| Input is empty or too short | Input is < 3 words or contains only noise/fillers |
| Transcription error markers | Input contains "[inaudible]", "??", or "[noise]" |

---

## FALLBACK RESPONSE RULES

When fallback triggers:
1. Set `fallback.triggered = true`
2. List only the **critical missing fields** (not ALL null fields)
3. Set `fallback.clarification_prompt` to the appropriate bilingual question (see table below)
4. Still return whatever `intent` and `variables` could be extracted — never discard partial data
5. Route to `/home` as default screen

---

## CLARIFICATION PROMPT LIBRARY

### By Intent Type

| Intent | Missing Field | Clarification Prompt |
|--------|--------------|----------------------|
| `POST_JOB` | `location` | "Aap kahan se hain? Apna gaon ya zila batao. (Where are you from? Tell your village or district.)" |
| `POST_JOB` | `worker_count` | "Aapko kitne mazdoor chahiye? (How many workers do you need?)" |
| `POST_JOB` | `start_date` | "Kaam kab se shuru karna hai? (When do you want to start the work?)" |
| `POST_JOB` | `crop_type` | "Kaun si fasal hai? Gehu, chawal, ya koi aur? (What crop? Wheat, rice, or something else?)" |
| `SEARCH_WORKERS` | `location` | "Kahan mazdoor dhundhna hai? Apna area batao. (Where do you want to find workers? Tell your area.)" |
| `NAVIGATE` | `navigate_target` | "Kahan jaana hai? Worker list, job board, ya kuch aur? (Where to go? Worker list, job board, or something else?)" |
| `EQUIPMENT_RENT` | `equipment_type` | "Kaun si machine chahiye? Tractor, harvester, ya sprayer? (What machine do you need?)" |
| `ADVISORY` | `query_text` | "Aap kya jaanna chahte hain? Fasal, mitti, ya mausam ke baare mein? (What do you want to know? About crop, soil, or weather?)" |
| `UNKNOWN` | (any) | "Aap kya karna chahte hain? Main aapki madad karna chahta hoon. (What would you like to do? I want to help you.)" |

### For Multiple Missing Fields
Combine the most critical 2 fields into one prompt. Never ask for more than 2 things at once.

Example (missing location + worker_count):
`"Aap kahan se hain aur kitne mazdoor chahiye? (Where are you from and how many workers do you need?)"`

---

## FALLBACK RETRY LOGIC

The frontend (Intern 1) should implement:
1. **First fallback**: Display clarification prompt, allow farmer to speak again
2. **Second consecutive fallback**: Display a simplified manual form with large buttons
3. **Third consecutive fallback**: Escalate to human support (future Phase 2 feature)

The parser's job is only to signal the fallback and provide the clarification prompt. Retry counting is handled by the frontend.

---

## EMPTY / NOISE INPUT HANDLING

If the raw input contains ONLY these patterns, immediately trigger fallback with `UNKNOWN`:
- Empty string: `""`
- Only whitespace: `"   "`
- Only fillers: `"umm", "ahhh", "hmm", "haan", "nahi"`
- Transcription error markers: `"[inaudible]"`, `"[noise]"`, `"..."`
- Single word inputs that don't map to any intent trigger phrase

---

## PARTIAL PARSE — NEVER DISCARD DATA

Even when fallback is triggered, **always include** whatever was successfully extracted:

```json
{
  "intent": "POST_JOB",
  "confidence": 0.45,
  "variables": {
    "crop_type": "wheat",
    "worker_count": null,
    "start_date": null,
    "location": null,
    ...
  },
  "fallback": {
    "triggered": true,
    "missing_fields": ["worker_count", "location"],
    "clarification_prompt": "Aap kahan se hain aur kitne mazdoor chahiye? (Where are you from and how many workers do you need?)"
  }
}
```

The frontend can prefill `cropType: "wheat"` and only ask the farmer for the missing pieces — not restart from scratch.

---

## LANGUAGE DETECTION FALLBACK

If input appears to be in a language the model has low confidence parsing (e.g., Tamil, Telugu, Odia with no translation):
- Attempt extraction with available context
- Set `confidence` accordingly
- Add to `query_text`: `"[Language Note: Input appears to contain regional language with low parse confidence]"`
