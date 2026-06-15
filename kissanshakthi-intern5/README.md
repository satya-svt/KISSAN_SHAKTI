# 🧠 KissanShakthi — AI Intent Parser
### Intern 5 | Phase 1 | 10-Day Sprint Deliverable

> **The voice brain of KissanShakthi.** Converts transcribed farmer speech into structured JSON that drives form auto-fill and screen navigation — powered by Google Gemini 1.5 Flash.

---

## 📌 What This Module Does

KissanShakthi is a **Voice-First, Offline-First** farming platform for rural Indian farmers who face labour shortages during harvest season. Farmers cannot type easily and often have no internet — so they **speak** to the app in their local language.

This module is **Step 2** of the voice pipeline:

```
🎤 Farmer speaks
      ↓
  Intern 4 — Voice Transcriber   →   raw text
      ↓
  Intern 5 — AI Intent Parser    →   structured JSON   ← THIS MODULE
      ↓
  Intern 1 — Frontend UI         →   auto-fills form + navigates screen
      ↓
  Intern 3 — Backend Sync API    →   saves to Intern 2's database
```

**Input** (from Intern 4):
```
"mujhe 5 mazdoor chahiye gehu ke liye, Nashik ke paas, July 15 se"
```

**Output** (to Intern 1):
```json
{
  "intent": "POST_JOB",
  "confidence": 0.91,
  "variables": {
    "crop_type": "wheat",
    "worker_count": 5,
    "location": "Nashik",
    "start_date": "2025-07-15"
  },
  "routing": {
    "screen": "/post-job",
    "prefill": {
      "cropType": "wheat",
      "workersNeeded": 5,
      "location": "Nashik",
      "startDate": "2025-07-15"
    }
  },
  "fallback": { "triggered": false }
}
```

---

## 🚀 Live Demo

Open **`index.html`** directly in your browser — no server or build step needed.

1. Get a **free** Gemini API key → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Open `index.html` in Chrome or Edge
3. Paste your API key in the setup card at the top
4. Click any **quick test chip** or type your own farmer voice input
5. Press **🚀 Parse Intent with Gemini** (or `Ctrl + Enter`)
6. Run all **20 automated test cases** with one click to check accuracy

---

## 📂 File Structure

```
kissanshakthi-intern5/
│
├── index.html                          ← Interactive demo + test suite UI
├── intent-parser.js                    ← Core parser module (main API)
│
├── prompts/
│   ├── system-prompt.md                ← Master Gemini system prompt
│   ├── variable-extraction-prompt.md   ← Variable extraction rules
│   ├── output-schema.json              ← Enforced JSON output schema
│   ├── routing-map.json                ← Voice → UI screen route map
│   └── fallback-rules.md               ← Fallback & clarification rules
│
├── tests/
│   ├── test-cases.json                 ← 20 mock test cases
│   └── accuracy-report.md              ← Accuracy audit template
│
└── docs/
    └── handoff-spec.md                 ← Full integration spec for teammates
```

---

## ⚙️ How to Use the Parser (Integration Guide)

### In the Browser
```html
<!-- Include the module -->
<script src="intent-parser.js"></script>

<script>
  const result = await KissanShakthiParser.parseIntent(transcriptText, GEMINI_API_KEY);
  console.log(result.intent);           // "POST_JOB"
  console.log(result.routing.screen);   // "/post-job"
  console.log(result.routing.prefill);  // { cropType: "wheat", workersNeeded: 5, ... }
</script>
```

### In Node.js
```js
const { parseIntent } = require('./intent-parser.js');

const result = await parseIntent(
  "I need 8 workers for wheat harvest near Nashik from July 10",
  process.env.GEMINI_API_KEY
);
```

### For Intern 1 — Frontend Integration
```js
const result = await KissanShakthiParser.parseIntent(transcript, GEMINI_API_KEY);

// Navigate to the correct screen
router.push(result.routing.screen);

// Prefill the form (keys match React state field names)
setFormState(result.routing.prefill);

// Show clarification if input was unclear
if (result.fallback.triggered) {
  showDialog(result.fallback.clarification_prompt);
}
```

---

## 🗂️ Supported Intents

| Intent | Screen Route | Trigger Example |
|--------|-------------|----------------|
| `POST_JOB` | `/post-job` | "I need 8 workers for wheat harvest near Nashik" |
| `SEARCH_WORKERS` | `/workers` | "Show workers available near Aurangabad" |
| `REGISTER_WORKER` | `/register-worker` | "I am a tractor operator, register me" |
| `VIEW_LISTINGS` | `/jobs` | "Show all available jobs" |
| `CHECK_STATUS` | `/bookings` | "Did anyone apply to my posting?" |
| `NAVIGATE` | *(dynamic)* | "Take me to the job board" |
| `EQUIPMENT_RENT` | `/equipment` | "I need to rent a combine harvester" |
| `ADVISORY` | `/advisory` | "Best time to plant onion in Maharashtra?" |
| `UNKNOWN` | `/` | Unclear input → fallback triggered |

---

## 📊 Extracted Variables

The parser attempts to extract all of these from every input:

| Variable | Type | Example |
|----------|------|---------|
| `crop_type` | string | `"wheat"`, `"rice"`, `"sugarcane"` |
| `worker_count` | integer | `8` |
| `start_date` | string (ISO) | `"2025-07-15"` |
| `end_date` | string (ISO) | `"2025-07-20"` |
| `duration_days` | integer | `5` |
| `location` | string | `"Nashik"`, `"near Pune"` |
| `wage_per_day` | integer (INR) | `400` |
| `worker_skill` | string | `"tractor_operator"` |
| `equipment_type` | string | `"harvester"` |
| `navigate_target` | string | `"worker_list"` |
| `query_text` | string | `"pest problem in cotton"` |

---

## 🌐 Regional Language Support

The parser handles **Hinglish**, **Marathi-English**, and **Kannada-English** mixed inputs:

| Regional Word | Normalized To |
|--------------|--------------|
| `gehu / gehun` | `wheat` |
| `chawal / dhan` | `rice` |
| `ganna` | `sugarcane` |
| `mazdoor / majdoor` | worker |
| `chahiye` | need/want |
| `ke paas` | near |
| `mein` | in (location) |
| `roz` | per day (wage) |

---

## 🛡️ Fallback Handling

When the input is unclear, incomplete, or noisy — the parser **never crashes**. It:

1. Sets `fallback.triggered = true`
2. Lists exactly which critical fields are missing
3. Returns a **bilingual Hindi-English clarification prompt** the app shows the farmer

```json
"fallback": {
  "triggered": true,
  "missing_fields": ["location", "worker_count"],
  "clarification_prompt": "Aap kahan se hain aur kitne mazdoor chahiye? (Where are you from and how many workers do you need?)"
}
```

Noisy inputs like `"umm... haan... nahi..."` are caught **locally** without even making an API call.

---

## 🧪 Running the Test Suite

The demo page (`index.html`) includes a built-in test runner with **20 test cases** covering:
- Clean English inputs
- Hinglish / transliterated inputs
- Partial data (fallback expected)
- Self-correction ("not 5, 10 workers")
- Navigation commands
- Noise / empty inputs

Click **▶ Run All 20 Tests** in the demo to get a live accuracy report.

---

## 🔑 API Requirements

| Detail | Value |
|--------|-------|
| Model | Google Gemini 1.5 Flash |
| Free tier | 15 requests/min, 1M tokens/day |
| Auth | API key via query param |
| Get key | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

> ⚠️ Never commit your API key. Store it in `.env` for backend usage. In the demo, it is saved only in your browser's `localStorage`.

---

## 🤝 Cross-Team Integration Points

| Team | Handshake |
|------|-----------|
| **Intern 4 (Voice Transcriber)** | Passes plain transcript string as input |
| **Intern 1 (Frontend UI)** | Reads `routing.screen` and `routing.prefill` from output |
| **Intern 3 (Backend Sync)** | Logs `intent`, `confidence`, `raw_input` to audit table |

Full integration contract → [`docs/handoff-spec.md`](./docs/handoff-spec.md)

---

## 📅 10-Day Sprint Summary

| Days | Deliverable |
|------|-------------|
| Day 1–2 | System prompt + intent classification design |
| Day 3–4 | Variable extraction rules + JSON output schema |
| Day 5–6 | Fuzzy input handler + voice routing map |
| Day 7 | Fallback rules + noisy input detection |
| Day 8 | Interactive demo page + form prefill verification |
| Day 9–10 | Test suite (20 cases) + accuracy report + handoff spec |

---

## 👤 Author

**Intern 5 — AI Intent Parser**  
KissanShakthi Phase 1 Squad  
Powered by [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/)
