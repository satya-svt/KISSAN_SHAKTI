# Variable Extraction Prompt Rules
## Day 3–4 Deliverable | Intern 5 (AI Intent Parser)

---

## PURPOSE

This document defines the detailed variable extraction rules the AI model must follow when parsing KissanShakthi voice transcripts. These rules supplement the master system prompt and govern how specific field types are extracted.

---

## EXTRACTION RULE BOOK

### Rule 1: Crop Type Extraction
- Recognize crop names in English AND transliterated regional names:
  - `gehu / gehun` → `"wheat"`
  - `chawal / dhan` → `"rice"`
  - `ganna` → `"sugarcane"`
  - `makka` → `"maize"`
  - `pyaz` → `"onion"`
  - `tamatar` → `"tomato"`
  - `kela` → `"banana"`
  - `kapas` → `"cotton"`
  - `soyabean / soya` → `"soybean"`
  - `arhar / tur` → `"pigeon pea"`
- Always normalize to standard English crop name in lowercase.

### Rule 2: Worker Count Extraction
- Extract numerical values: "5", "five", "panch" → `5`
- Extract approximate ranges: "4-5 workers" → extract midpoint or lower bound: `4`
- Extract contextual numbers: "a dozen workers" → `12`
- "handful", "few" → `null` (too vague)
- "many", "lots" → `null`

### Rule 3: Date Extraction
- Explicit dates: "July 15", "15 July", "15/7" → `"2025-07-15"` (assume current year unless specified)
- Relative dates (resolve relative to current date at call time):
  - "tomorrow" → resolve dynamically
  - "next Monday" → resolve dynamically  
  - "in 3 days" → resolve dynamically
- Seasons: "after monsoon" → `null` (too vague, flag as missing)
- Return ISO 8601 format: `YYYY-MM-DD`

### Rule 4: Location Extraction
- Extract the most specific location mentioned
- Normalize common Indian location mentions:
  - "paas" / "ke paas" = "near [X]"
  - "mera gaon" = `null` (unknown village)
  - District/state names should be title-cased: "nashik" → "Nashik"
- If multiple locations mentioned, use the primary/first one

### Rule 5: Wage Extraction
- Recognize currency markers: "rupees", "Rs", "₹", "rs"
- "400 per day", "daily 350", "350 roz" → `wage_per_day: 350`
- "total 2000 for 5 days" → calculate: `2000/5 = 400` per day
- If only total mentioned without duration, set `wage_per_day: null`, note in `query_text`

### Rule 6: Duration Extraction
- "for 5 days", "5 din ka kaam", "one week" → `duration_days`
- "one week" → `7`
- "fortnight" → `14`
- Infer from start+end dates if both present

### Rule 7: Worker Skill Extraction
- "tractor driver", "operator" → `"tractor_operator"`
- "sickle work", "daat se katna" → `"manual_harvesting"`
- "sprayer" → `"pesticide_sprayer"`
- "general labor", "koi bhi" → `"general_labor"`

### Rule 8: Navigation Target Mapping
- Voice phrase → `navigate_target` → `routing.screen`

| Voice Phrase Variants                                | navigate_target      | Screen Route        |
|-----------------------------------------------------|----------------------|---------------------|
| "worker list", "show workers", "labourers list"      | `worker_list`        | `/workers`          |
| "job board", "available jobs", "show jobs"           | `job_board`          | `/jobs`             |
| "post a job", "create job", "add job posting"        | `post_job_form`      | `/post-job`         |
| "register", "sign up", "my profile"                  | `worker_register`    | `/register-worker`  |
| "home", "main menu", "back to home"                  | `home`               | `/`                 |
| "equipment", "machines", "rent tractor"              | `equipment_rental`   | `/equipment`        |
| "advisory", "farming tips", "crop advice"            | `advisory`           | `/advisory`         |
| "my bookings", "my applications", "status"           | `my_bookings`        | `/bookings`         |

---

## CRITICAL FIELD MATRIX

For each intent, these fields are CRITICAL (missing = trigger fallback):

| Intent            | Critical Fields                                    |
|-------------------|----------------------------------------------------|
| `POST_JOB`        | `crop_type`, `worker_count`, `start_date`, `location` |
| `SEARCH_WORKERS`  | `location`                                          |
| `REGISTER_WORKER` | (none — profile is filled via form)                |
| `NAVIGATE`        | `navigate_target`                                   |
| `EQUIPMENT_RENT`  | `equipment_type`                                    |
| `ADVISORY`        | `query_text`                                        |
| `VIEW_LISTINGS`   | (none)                                              |
| `CHECK_STATUS`    | (none)                                              |

---

## FUZZY INPUT HANDLING (Day 5 — Advanced Rules)

### Partial Sentence Completion
If the user says: "I want to post... uhhh... wheat... 10 workers..."
→ Extract what's available: `crop_type: "wheat"`, `worker_count: 10`
→ Flag missing critical fields, trigger clarification for those only

### Conversational Fillers
Strip and ignore: "umm", "ahhh", "ek second", "matlab", "woh", "basically", "actually"

### Mixed Language Normalization
The parser must handle Hinglish (Hindi-English mix), Marathi-English, and Kannada-English.
Common patterns:
- "Mujhe 5 worker chahiye wheat harvest ke liye Nashik mein July 15 se"
  → Full parse: `POST_JOB`, worker_count=5, crop="wheat", location="Nashik", start_date="2025-07-15"

### Repetition & Self-Correction
"I need... no wait... 8 workers, not 5, 8 workers"
→ Always use the LAST stated value: `worker_count: 8`

### Compound Requests
"Find workers AND post a job" → Use the FIRST clear intent (SEARCH_WORKERS), note the compound in `query_text`
