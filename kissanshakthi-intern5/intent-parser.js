/**
 * KissanShakthi AI Intent Parser — Core Module
 * Intern 5 | Day 1–7 Deliverable
 * 
 * Receives transcribed voice text → classifies intent → extracts variables
 * → returns strict JSON output for Intern 1 (Frontend) to consume.
 * 
 * Uses: Google Gemini 1.5 Flash API
 */

'use strict';

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────
const PARSER_CONFIG = {
  modelName: 'gemini-1.5-flash',
  apiVersion: 'v1beta',
  parserVersion: '1.0.0',
  confidenceThreshold: 0.6,          // Below this → trigger fallback
  maxInputLength: 500,               // Characters
  minInputWords: 2,                  // Below this → immediate fallback
  fallbackRetryMax: 3,               // Max retries before escalating
};

// ─────────────────────────────────────────────
// ROUTE MAP (mirrors routing-map.json)
// ─────────────────────────────────────────────
const ROUTE_MAP = {
  home:              '/',
  worker_list:       '/workers',
  job_board:         '/jobs',
  post_job_form:     '/post-job',
  worker_register:   '/register-worker',
  equipment_rental:  '/equipment',
  advisory:          '/advisory',
  my_bookings:       '/bookings',
  profile:           '/profile',
};

// Field mapping: parser variables → Intern 1 React form field names
const PREFILL_FIELD_MAP = {
  crop_type:      'cropType',
  worker_count:   'workersNeeded',
  start_date:     'startDate',
  end_date:       'endDate',
  duration_days:  'durationDays',
  location:       'location',
  wage_per_day:   'wagePerDay',
  worker_skill:   'workerSkill',
  equipment_type: 'equipmentType',
  query_text:     'searchQuery',
};

// ─────────────────────────────────────────────
// INTENT → DEFAULT SCREEN ROUTING
// ─────────────────────────────────────────────
const INTENT_DEFAULT_SCREEN = {
  POST_JOB:         '/post-job',
  SEARCH_WORKERS:   '/workers',
  REGISTER_WORKER:  '/register-worker',
  VIEW_LISTINGS:    '/jobs',
  CHECK_STATUS:     '/bookings',
  NAVIGATE:         '/',              // overridden by navigate_target
  EQUIPMENT_RENT:   '/equipment',
  ADVISORY:         '/advisory',
  UNKNOWN:          '/',
};

// ─────────────────────────────────────────────
// NOISE / EMPTY INPUT DETECTION (Day 7)
// ─────────────────────────────────────────────
const NOISE_PATTERNS = [
  /^\s*$/,                              // Empty / whitespace only
  /^\[inaudible\]$/i,                   // Transcription error
  /^\[noise\]$/i,
  /^\.{2,}$/,                           // Only ellipsis
  /^(umm+|ahh+|hmm+|haan|nahi|okay|ok|huh|uh+)\s*\.?$/i,  // Fillers only
];

function isNoisyInput(text) {
  if (!text || typeof text !== 'string') return true;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < PARSER_CONFIG.minInputWords) return true;
  return NOISE_PATTERNS.some(pattern => pattern.test(text.trim()));
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT BUILDER (Day 1–2)
// ─────────────────────────────────────────────
function buildSystemPrompt() {
  const today = new Date().toISOString().split('T')[0];

  return `You are KissanShakthi's AI Intent Parser for a voice-first farming platform in India.

TODAY'S DATE: ${today}

TASK: Analyze the transcribed farmer voice input and return a STRICT JSON response.

## INTENT TAXONOMY
Classify into exactly ONE intent:
- POST_JOB: Farmer needs workers for harvesting/labor
- SEARCH_WORKERS: Looking for available nearby workers
- REGISTER_WORKER: Laborer wants to register their profile
- VIEW_LISTINGS: Wants to see existing job listings
- CHECK_STATUS: Checking status of a posting or booking
- NAVIGATE: Going to a specific screen (only if explicitly stated)
- EQUIPMENT_RENT: Wants to rent farm equipment
- ADVISORY: Wants farming advice or tips
- UNKNOWN: Genuinely unclear or off-topic

## VARIABLE EXTRACTION
Extract ALL variables present in the input (set to null if not mentioned):
- crop_type: string (normalize to English lowercase: "wheat", "rice", "sugarcane", etc.)
- worker_count: integer (number of workers)
- start_date: string ISO YYYY-MM-DD (resolve relative dates from today: ${today})
- end_date: string ISO YYYY-MM-DD or null
- duration_days: integer
- location: string (Title-cased village/town/district)
- wage_per_day: integer (INR)
- worker_skill: one of ["general_labor","tractor_operator","manual_harvesting","pesticide_sprayer","irrigation_worker","planting_worker","sorting_worker"] or null
- equipment_type: string or null
- navigate_target: one of ["home","worker_list","job_board","post_job_form","worker_register","equipment_rental","advisory","my_bookings","profile"] or null
- query_text: string (for ADVISORY or ambiguous queries)

## REGIONAL LANGUAGE SUPPORT
Handle Hinglish/transliterated inputs:
- gehu/gehun → wheat | chawal/dhan → rice | ganna → sugarcane | makka → maize
- mazdoor/majoori → worker/labor | kaam → work/job | gaon → village
- chahiye → need/want | dhundho → find | paas → near | se → from

## CRITICAL OUTPUT RULES
1. ALWAYS return ONLY a valid JSON object. NO markdown, NO explanations, NO extra text.
2. NEVER omit any field - use null for missing values.
3. confidence: float 0.0-1.0
4. For NAVIGATE intent, resolve navigate_target from: "worker list"→worker_list, "job board"→job_board, "post job"→post_job_form, "register"→worker_register, "home"→home, "equipment"→equipment_rental, "advisory"→advisory, "bookings"→my_bookings, "profile"→profile
5. If multiple values stated (self-correction), use the LAST stated value.

## FALLBACK RULES
If confidence < 0.6 OR intent is UNKNOWN OR critical fields for the intent are all null:
- Set fallback.triggered = true
- List missing critical fields in fallback.missing_fields
- Set fallback.clarification_prompt to a SHORT bilingual Hindi-English question (max 20 words)

Critical fields per intent:
- POST_JOB: [crop_type, worker_count, start_date, location]
- SEARCH_WORKERS: [location]
- NAVIGATE: [navigate_target]
- EQUIPMENT_RENT: [equipment_type]
- ADVISORY: [query_text]

## REQUIRED JSON STRUCTURE
{
  "intent": "...",
  "confidence": 0.0,
  "variables": {
    "crop_type": null,
    "worker_count": null,
    "start_date": null,
    "end_date": null,
    "duration_days": null,
    "location": null,
    "wage_per_day": null,
    "worker_skill": null,
    "equipment_type": null,
    "navigate_target": null,
    "query_text": null
  },
  "routing": {
    "screen": "/",
    "prefill": {
      "cropType": null,
      "workersNeeded": null,
      "startDate": null,
      "endDate": null,
      "durationDays": null,
      "location": null,
      "wagePerDay": null,
      "workerSkill": null,
      "equipmentType": null,
      "searchQuery": null
    }
  },
  "fallback": {
    "triggered": false,
    "missing_fields": [],
    "clarification_prompt": null
  },
  "raw_input": "..."
}`;
}

// ─────────────────────────────────────────────
// ROUTING RESOLVER (Day 6)
// ─────────────────────────────────────────────
function resolveScreen(intent, navigateTarget) {
  if (intent === 'NAVIGATE' && navigateTarget && ROUTE_MAP[navigateTarget]) {
    return ROUTE_MAP[navigateTarget];
  }
  return INTENT_DEFAULT_SCREEN[intent] || '/';
}

// ─────────────────────────────────────────────
// PREFILL BUILDER (Day 8 — Intern 1 Integration)
// ─────────────────────────────────────────────
function buildPrefillMap(variables) {
  const prefill = {};
  for (const [parserKey, frontendKey] of Object.entries(PREFILL_FIELD_MAP)) {
    prefill[frontendKey] = variables[parserKey] ?? null;
  }
  return prefill;
}

// ─────────────────────────────────────────────
// IMMEDIATE FALLBACK RESPONSE (Day 7)
// Returns a valid parser response for noisy/empty inputs without API call.
// ─────────────────────────────────────────────
function buildImmediateFallback(rawInput) {
  return {
    intent: 'UNKNOWN',
    confidence: 0.0,
    variables: {
      crop_type: null,
      worker_count: null,
      start_date: null,
      end_date: null,
      duration_days: null,
      location: null,
      wage_per_day: null,
      worker_skill: null,
      equipment_type: null,
      navigate_target: null,
      query_text: null,
    },
    routing: {
      screen: '/',
      prefill: {
        cropType: null,
        workersNeeded: null,
        startDate: null,
        endDate: null,
        durationDays: null,
        location: null,
        wagePerDay: null,
        workerSkill: null,
        equipmentType: null,
        searchQuery: null,
      },
    },
    fallback: {
      triggered: true,
      missing_fields: ['intent'],
      clarification_prompt:
        'Aap kya karna chahte hain? Main aapki madad karna chahta hoon. (What would you like to do? I want to help you.)',
    },
    raw_input: rawInput || '',
    metadata: {
      parser_version: PARSER_CONFIG.parserVersion,
      model_used: 'local-fallback',
      timestamp: new Date().toISOString(),
      processing_ms: 0,
    },
  };
}

// ─────────────────────────────────────────────
// JSON EXTRACTION FROM MODEL RESPONSE
// Handles cases where model wraps JSON in markdown code fences.
// ─────────────────────────────────────────────
function extractJSON(rawText) {
  if (!rawText) throw new Error('Empty response from model');
  
  // Try direct parse first
  try {
    return JSON.parse(rawText.trim());
  } catch (_) {}

  // Strip markdown code fences: ```json ... ```
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {}
  }

  // Try to find first { ... } block
  const braceStart = rawText.indexOf('{');
  const braceEnd = rawText.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(rawText.slice(braceStart, braceEnd + 1));
    } catch (_) {}
  }

  throw new Error('Could not extract valid JSON from model response');
}

// ─────────────────────────────────────────────
// RESPONSE VALIDATOR & NORMALIZER (Day 8)
// Ensures output always matches the schema exactly.
// ─────────────────────────────────────────────
function normalizeResponse(parsed, rawInput, processingMs) {
  const allVariableKeys = [
    'crop_type', 'worker_count', 'start_date', 'end_date', 'duration_days',
    'location', 'wage_per_day', 'worker_skill', 'equipment_type',
    'navigate_target', 'query_text',
  ];

  const VALID_INTENTS = [
    'POST_JOB', 'SEARCH_WORKERS', 'REGISTER_WORKER', 'VIEW_LISTINGS',
    'CHECK_STATUS', 'NAVIGATE', 'EQUIPMENT_RENT', 'ADVISORY', 'UNKNOWN',
  ];

  // Normalize intent
  const intent = VALID_INTENTS.includes(parsed.intent) ? parsed.intent : 'UNKNOWN';

  // Normalize confidence
  const confidence = typeof parsed.confidence === 'number'
    ? Math.min(1, Math.max(0, parsed.confidence))
    : 0.5;

  // Normalize variables — ensure all keys present
  const variables = {};
  const rawVars = parsed.variables || {};
  for (const key of allVariableKeys) {
    variables[key] = rawVars[key] !== undefined ? rawVars[key] : null;
  }

  // Resolve routing
  const screen = resolveScreen(intent, variables.navigate_target);
  const prefill = buildPrefillMap(variables);

  // Normalize fallback
  const fallbackTriggered =
    confidence < PARSER_CONFIG.confidenceThreshold ||
    intent === 'UNKNOWN' ||
    (parsed.fallback && parsed.fallback.triggered === true);

  const fallback = {
    triggered: fallbackTriggered,
    missing_fields: (parsed.fallback && Array.isArray(parsed.fallback.missing_fields))
      ? parsed.fallback.missing_fields
      : [],
    clarification_prompt: (parsed.fallback && parsed.fallback.clarification_prompt)
      ? parsed.fallback.clarification_prompt
      : (fallbackTriggered
          ? 'Aap kya karna chahte hain? (What would you like to do?)'
          : null),
  };

  return {
    intent,
    confidence,
    variables,
    routing: { screen, prefill },
    fallback,
    raw_input: rawInput,
    metadata: {
      parser_version: PARSER_CONFIG.parserVersion,
      model_used: PARSER_CONFIG.modelName,
      timestamp: new Date().toISOString(),
      processing_ms: processingMs,
    },
  };
}

// ─────────────────────────────────────────────
// MAIN PARSE FUNCTION (Public API)
// ─────────────────────────────────────────────

/**
 * Parses a transcribed voice input string using Gemini.
 *
 * @param {string} transcribedText - The voice transcript from Intern 4
 * @param {string} geminiApiKey    - Google Gemini API key
 * @returns {Promise<Object>}        Structured intent parser response
 *
 * @example
 * const result = await parseIntent(
 *   "I need 8 workers for wheat harvest near Nashik from July 10",
 *   "YOUR_GEMINI_API_KEY"
 * );
 * // result.intent === "POST_JOB"
 * // result.routing.screen === "/post-job"
 * // result.routing.prefill.workersNeeded === 8
 */
async function parseIntent(transcribedText, geminiApiKey) {
  const startTime = Date.now();

  // ── Guard: noisy/empty input ──────────────────
  if (isNoisyInput(transcribedText)) {
    return buildImmediateFallback(transcribedText);
  }

  // ── Guard: truncate oversized inputs ─────────
  const input = transcribedText.slice(0, PARSER_CONFIG.maxInputLength).trim();

  // ── Build Gemini API request ─────────────────
  const endpoint = `https://generativelanguage.googleapis.com/${PARSER_CONFIG.apiVersion}/models/${PARSER_CONFIG.modelName}:generateContent?key=${geminiApiKey}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt() }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `Parse this farmer voice input:\n\n"${input}"` }],
      },
    ],
    generationConfig: {
      temperature: 0.1,          // Low temp for consistent structured output
      topP: 0.8,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',  // Force JSON output mode
    },
  };

  // ── API Call ─────────────────────────────────
  let rawResponseText;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error ${response.status}: ${errorData?.error?.message || response.statusText}`
      );
    }

    const responseData = await response.json();
    rawResponseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawResponseText) {
      throw new Error('No content in Gemini response');
    }
  } catch (networkError) {
    // Network failure → return fallback with error note
    const fallback = buildImmediateFallback(input);
    fallback.fallback.clarification_prompt =
      'Connection error. Please try again. (Connection problem hai. Phir se koshish karein.)';
    fallback.metadata.processing_ms = Date.now() - startTime;
    fallback._error = networkError.message;
    return fallback;
  }

  // ── Parse & Normalize Response ───────────────
  const processingMs = Date.now() - startTime;
  try {
    const parsed = extractJSON(rawResponseText);
    return normalizeResponse(parsed, input, processingMs);
  } catch (parseError) {
    const fallback = buildImmediateFallback(input);
    fallback.metadata.processing_ms = processingMs;
    fallback._error = `JSON parse error: ${parseError.message}`;
    return fallback;
  }
}

// ─────────────────────────────────────────────
// BATCH PARSE (for test suites — Day 9)
// ─────────────────────────────────────────────

/**
 * Parses multiple transcripts sequentially with a delay to avoid rate limits.
 * 
 * @param {string[]} transcripts   - Array of voice transcript strings
 * @param {string}   geminiApiKey  - Google Gemini API key
 * @param {number}   delayMs       - Delay between requests (default 500ms)
 * @returns {Promise<Object[]>}      Array of parser results
 */
async function batchParseIntents(transcripts, geminiApiKey, delayMs = 500) {
  const results = [];
  for (let i = 0; i < transcripts.length; i++) {
    const result = await parseIntent(transcripts[i], geminiApiKey);
    results.push(result);
    if (i < transcripts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

// ─────────────────────────────────────────────
// ACCURACY EVALUATOR (Day 9)
// Compares parser output against expected test cases.
// ─────────────────────────────────────────────

/**
 * Evaluates parser accuracy against a test case dataset.
 * 
 * @param {Object[]} testCases      - Array of {input, expected_intent, expected_variables}
 * @param {string}   geminiApiKey   - Gemini API key
 * @returns {Promise<Object>}         Accuracy report
 */
async function evaluateAccuracy(testCases, geminiApiKey) {
  const report = {
    total: testCases.length,
    intent_correct: 0,
    intent_accuracy: 0,
    variable_scores: {},
    fallback_triggered_correct: 0,
    results: [],
    timestamp: new Date().toISOString(),
  };

  for (const testCase of testCases) {
    const result = await parseIntent(testCase.input, geminiApiKey);
    const intentMatch = result.intent === testCase.expected_intent;
    
    if (intentMatch) report.intent_correct++;

    const varScores = {};
    if (testCase.expected_variables) {
      for (const [key, expectedVal] of Object.entries(testCase.expected_variables)) {
        const actualVal = result.variables[key];
        varScores[key] = actualVal === expectedVal;
        if (!report.variable_scores[key]) {
          report.variable_scores[key] = { correct: 0, total: 0 };
        }
        report.variable_scores[key].total++;
        if (varScores[key]) report.variable_scores[key].correct++;
      }
    }

    report.results.push({
      input: testCase.input,
      expected_intent: testCase.expected_intent,
      actual_intent: result.intent,
      intent_match: intentMatch,
      confidence: result.confidence,
      variable_scores: varScores,
      fallback_triggered: result.fallback.triggered,
    });

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  report.intent_accuracy = ((report.intent_correct / report.total) * 100).toFixed(1) + '%';

  // Calculate per-variable accuracy
  for (const key of Object.keys(report.variable_scores)) {
    const s = report.variable_scores[key];
    s.accuracy = ((s.correct / s.total) * 100).toFixed(1) + '%';
  }

  return report;
}

// ─────────────────────────────────────────────
// EXPORTS (for use in browser and Node.js)
// ─────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  // Node.js / CommonJS
  module.exports = { parseIntent, batchParseIntents, evaluateAccuracy, PARSER_CONFIG, ROUTE_MAP };
} else if (typeof window !== 'undefined') {
  // Browser global
  window.KissanShakthiParser = { parseIntent, batchParseIntents, evaluateAccuracy, PARSER_CONFIG, ROUTE_MAP };
}
