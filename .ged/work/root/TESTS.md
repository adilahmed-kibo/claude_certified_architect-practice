# Tests

## Project-wide checks

- [x] No `DEEPSEEK_API_KEY` string remains anywhere in the repo.
- [x] No `deepseek` string (case-insensitive) remains anywhere in the repo.
- [x] `package.json` contains `@google/genai`.
- [x] `api/generate-questions.js` imports `@google/genai` and references `gemini-3.1-flash-lite`.

## Task-specific checks

- T2 (`api/generate-questions.js`):
  - [x] `GEMINI_API_KEY` is read from `process.env`.
  - [x] `GoogleGenAI` is instantiated with `{ apiKey: process.env.GEMINI_API_KEY }`.
  - [x] `ai.models.generateContent` is called with `model: 'gemini-3.1-flash-lite'`.
  - [x] `config.responseMimeType` is set to `'application/json'`.
  - [x] `config.maxOutputTokens` is set (e.g. 4096).
  - [x] `config.temperature` is set (e.g. 0.7).
  - [x] The response text is extracted from `response.text`.
  - [x] Retry on invalid JSON still works (append bad response + correction prompt).
  - [x] Validation retry still works (append bad response + repair prompt).
  - [x] All other middleware (CORS, auth, rate limit, request validation) is unchanged.

- T3 (README):
  - [x] Mentions `GEMINI_API_KEY` instead of `DEEPSEEK_API_KEY`.
  - [x] Mentions Google AI Studio for getting the key.
  - [x] Mentions `gemini-3.1-flash-lite`.

## Verification method

- `node --check api/generate-questions.js` passed.
- `node -e "import('./api/generate-questions.js').then(...)` loaded without error.
- `npm install` succeeded, `@google/genai@2.8.0` installed.
- `grep -ri "deepseek" --exclude-dir=node_modules --exclude-dir=.ged .` returned no matches.
- `grep -ri "DEEPSEEK_API_KEY" --exclude-dir=node_modules --exclude-dir=.ged .` returned no matches.

## Retry policy

- Implementation retries before the plan must be tightened: 2

## Recovery rule

- If the same slice fails repeatedly, rewrite the slice, clarify the spec, and retry with a narrower plan.
