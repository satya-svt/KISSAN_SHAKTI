# AI Intent Parser — Accuracy Audit Report Template
## Day 9–10 Deliverable | Intern 5 (AI Intent Parser)

---

## REPORT METADATA

| Field | Value |
|-------|-------|
| Parser Version | 1.0.0 |
| Model Used | Google Gemini 1.5 Flash |
| Test Dataset | tests/test-cases.json (20 cases) |
| Evaluation Date | _(fill when running)_ |
| Evaluator | Intern 5 — AI Intent Parser |

---

## OVERALL SUMMARY

| Metric | Score |
|--------|-------|
| **Total Test Cases** | 20 |
| **Intent Classification Accuracy** | __%  (__ / 20 correct) |
| **Average Confidence Score** | __ |
| **Fallback Trigger Accuracy** | __%  (triggered when expected) |
| **Variable Extraction Accuracy** | __% (across all extracted fields) |

---

## INTENT-LEVEL BREAKDOWN

| Intent | Test Cases | Correct | Accuracy |
|--------|-----------|---------|----------|
| POST_JOB | 5 | __ | __% |
| SEARCH_WORKERS | 3 | __ | __% |
| REGISTER_WORKER | 2 | __ | __% |
| NAVIGATE | 3 | __ | __% |
| ADVISORY | 2 | __ | __% |
| EQUIPMENT_RENT | 2 | __ | __% |
| VIEW_LISTINGS | 1 | __ | __% |
| CHECK_STATUS | 1 | __ | __% |
| UNKNOWN | 1 | __ | __% |

---

## VARIABLE EXTRACTION ACCURACY

| Variable | Tested | Correct | Accuracy |
|----------|--------|---------|----------|
| crop_type | __ | __ | __% |
| worker_count | __ | __ | __% |
| start_date | __ | __ | __% |
| location | __ | __ | __% |
| wage_per_day | __ | __ | __% |
| duration_days | __ | __ | __% |
| navigate_target | __ | __ | __% |
| worker_skill | __ | __ | __% |
| equipment_type | __ | __ | __% |

---

## PER-CASE RESULTS

| ID | Input (truncated) | Expected | Actual | Match | Confidence | Fallback |
|----|-------------------|----------|--------|-------|-----------|---------|
| TC-001 | "I need 8 workers for wheat..." | POST_JOB | __ | __ | __ | __ |
| TC-002 | "mujhe 5 mazdoor chahiye..." | POST_JOB | __ | __ | __ | __ |
| TC-003 | "need workers for rice harvest" | POST_JOB | __ | __ | __ | __ |
| TC-004 | "I need... no wait... 10 workers..." | POST_JOB | __ | __ | __ | __ |
| TC-005 | "ganna katne ke liye 12 log..." | POST_JOB | __ | __ | __ | __ |
| TC-006 | "show me available workers near..." | SEARCH_WORKERS | __ | __ | __ | __ |
| TC-007 | "Nashik ke paas kaun mazdoor..." | SEARCH_WORKERS | __ | __ | __ | __ |
| TC-008 | "find me some workers" | SEARCH_WORKERS | __ | __ | __ | __ |
| TC-009 | "I am a farm worker and want..." | REGISTER_WORKER | __ | __ | __ | __ |
| TC-010 | "mujhe mazdoor ke roop mein..." | REGISTER_WORKER | __ | __ | __ | __ |
| TC-011 | "take me to the worker list page" | NAVIGATE | __ | __ | __ | __ |
| TC-012 | "job board dikhaao" | NAVIGATE | __ | __ | __ | __ |
| TC-013 | "go back to home page" | NAVIGATE | __ | __ | __ | __ |
| TC-014 | "what is the best time to plant..." | ADVISORY | __ | __ | __ | __ |
| TC-015 | "meri fasal mein keede lag rahe..." | ADVISORY | __ | __ | __ | __ |
| TC-016 | "I need to rent a tractor..." | EQUIPMENT_RENT | __ | __ | __ | __ |
| TC-017 | "combine harvester kiraye pe..." | EQUIPMENT_RENT | __ | __ | __ | __ |
| TC-018 | "show me all available job listings" | VIEW_LISTINGS | __ | __ | __ | __ |
| TC-019 | "did anyone apply to my job posting" | CHECK_STATUS | __ | __ | __ | __ |
| TC-020 | "umm... haan... nahi..." | UNKNOWN | __ | __ | __ | __ |

---

## FAILURE ANALYSIS

### Failed Cases
_(List test case IDs that failed and why)_

| TC-ID | Expected | Actual | Root Cause | Fix Applied |
|-------|----------|--------|-----------|-------------|
| | | | | |

### Common Failure Patterns
- [ ] Regional language transliteration missed
- [ ] Date parsing error (relative dates)
- [ ] Confidence too low for partial inputs
- [ ] Navigate intent over-triggering
- [ ] Self-correction (last-value) not followed

---

## LATENCY METRICS

| Metric | Value |
|--------|-------|
| Average Processing Time | __ ms |
| Min Processing Time | __ ms |
| Max Processing Time | __ ms |
| Immediate Fallback (no API call) | __ ms |
| Cases with >2000ms latency | __ |

---

## PROMPT OPTIMIZATION LOG

| Iteration | Change Made | Impact on Accuracy |
|-----------|-------------|-------------------|
| v1.0 | Initial prompt | Baseline |
| | | |

---

## RECOMMENDATIONS FOR PHASE 2

1. **Regional Language Expansion**: Add explicit Kannada, Telugu, Tamil, and Odia crop/labor vocabulary to the system prompt.
2. **Date Resolution Improvement**: Pass current date explicitly in each request (already implemented in v1.0).
3. **Confidence Calibration**: Consider lowering threshold for well-known intents (NAVIGATE) from 0.6 to 0.5.
4. **Batching**: Implement request batching for test suite runs to reduce API costs.
5. **Caching**: Cache identical inputs to avoid repeated API calls for the same query.

---

## SIGN-OFF

| Role | Name | Date | Status |
|------|------|------|--------|
| Intern 5 (AI Parser) | | | ☐ Reviewed |
| Intern 1 (Frontend) | | | ☐ Integration Verified |
| Intern 3 (Backend Sync) | | | ☐ API Contract Confirmed |
| Tech Lead / Mentor | | | ☐ Approved |
