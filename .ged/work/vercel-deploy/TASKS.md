# Tasks — Vercel Deploy + DeepSeek Generation

## Architecture

```
/
├── api/generate-questions.js   ← Vercel serverless function → DeepSeek v4 Flash
├── vercel.json                 ← Vercel routing config
├── quiz.html                   ← Updated with generation UI & progressive loading
├── index.html                  ← Minor updates
├── .gitignore                  ← Add .vercel
└── README.md                   ← Deployment instructions + DEEPSEEK_API_KEY setup
```

## Key Design Decisions (from planner critique)

- **Abuse control**: Server enforces count ≤ 5 per request, validates domain (1-5 or "all"), same-origin check (CORS), no unauthenticated unlimited generation
- **Timeout**: Vercel Hobby = 10s limit. Each API call generates max 5 questions (fits well within limit). `{ count }` in API = per-request count, not total. UI handles "Generate 20" as 4 sequential chunks of 5
- **DeepSeek API**: `deepseek-v4-flash` with `thinking: {"type": "enabled"}`, `reasoning_effort: "high"`, `response_format: {"type": "json_object"}`. No streaming (non-stream for simplicity)
- **Server-side validation**: Validate DeepSeek output schema before returning (required fields, options.length===4, correct in range, domain in range). If malformed, return structured error
- **Prompting**: Explicit JSON-only instruction, no markdown, exact schema in system prompt with 2 few-shot examples per domain
- **Few-shot access**: Hardcode 2-3 representative examples from existing pool directly in `api/generate-questions.js` (simplest approach, avoids sharing questions.js)
- **Progressive loading race conditions**: Use generation session ID, `isFetching` guard, `AbortController`, deduplicate by question text hash, ignore stale responses on reset/restart
- **Error resilience**: Failed generation doesn't break existing quiz mode. Original questions always usable. Retry option on failure

## Task 1: Create Vercel serverless API function

Create `api/generate-questions.js`:

- POST handler accepting `{ domain, count, questionsSoFar[] }`
- Server validates: count ≤ 5, domain in [1-5, "all"], max 1 request per ~1s (simple in-memory throttle)
- System prompt includes:
  - Domain weights and descriptions
  - Question format specification (JSON Schema)
  - 2-3 few-shot examples from existing pool (hardcoded)
  - Explicit instruction: JSON only, no markdown, no prose
- Calls DeepSeek v4 Flash with thinking mode enabled:
  ```json
  {
    "model": "deepseek-v4-flash",
    "messages": [...],
    "reasoning_effort": "high",
    "thinking": {"type": "enabled"},
    "response_format": {"type": "json_object"},
    "max_tokens": 4096
  }
  ```
- Server-side response validation:
  - JSON parse succeeds
  - `questions` array present with exactly `count` items
  - Each question has: `domain`, `scenario`, `situation`, `question`, `options` (length 4), `correct` (0-3), `explanation`
  - If validation fails: retry once with stricter prompt, else return structured error
- Returns `{ questions: [...], error?: string, sessionId: string }`
- On DeepSeek timeout / HTTP error → return descriptive error, don't crash

File to create:
- `api/generate-questions.js`

## Task 2: Create Vercel config

Create `vercel.json`:
```json
{
  "functions": {
    "api/generate-questions.js": {
      "maxDuration": 10
    }
  }
}
```
- No special rewrites needed (Vercel serves static files + api/ functions by default)
- Set Node.js runtime (not Edge) for DeepSeek HTTP calls
- Update `.gitignore` to include `.vercel`

Files to create/modify:
- `vercel.json`
- `.gitignore`

## Task 3: Update quiz.html with generation workflow

### 3a: Restructure question pools
- Rename existing `QUESTIONS` array to `ORIGINAL_QUESTIONS`
- Add state: `generatedQuestions = []`, `currentQuestions = []` (active pool), `questionSource = 'original' | 'generated'`
- "Reset to Original" button restores `ORIGINAL_QUESTIONS` as active pool

### 3b: Add generation UI to setup screen
- Add "Generate New Questions" section below existing mode/domain/count controls
- Optionally: radio/toggle between "Use original questions" and "Generate new ones"
- Question count for generation: "5", "10", "20", "40"
- "Generate" button → triggers first 5-question fetch

### 3c: Generating overlay/state
- When generation is in progress: show an overlay/spinner with "Generating your questions..." message
- During progressive loading: show subtle indicator ("Loading more questions...")
- Overlay dismisses once enough questions to start are ready (≥ first batch)

### 3d: Progressive loading state machine
- `targetCount`: total questions user wants (e.g., 20)
- `fetchedCount`: how many received so far
- Fetch 5 at a time
- When user answers a question and `fetchedCount - currentIndex <= 2` and `fetchedCount < targetCount`: trigger next fetch
- Guard: `isFetching = true` prevents concurrent fetches
- Session ID: generated on first fetch, passed with each request, stale responses ignored
- `AbortController`: cancel in-flight fetch on reset/restart
- Deduplication: hash question text, skip duplicates before appending
- If a chunk fails: show inline error, offer retry, existing questions remain usable

### 3e: Domain filter + generation
- Domain filter dropdown applies to generation (pass to API)
- If "All" selected, API instructed to produce mix across all domains

### 3f: Error handling
- API failure → show error message on screen with retry button
- Original questions remain selectable even if generation fails
- Malformed response → fallback error UI

Files to modify:
- `quiz.html` (major changes)

## Task 4: Update index.html (minor)

- Add link/mention of "Generate New Questions" feature
- Or redirect to quiz.html for generation (keep index.html as resource hub)

Files to modify:
- `index.html`

## Task 5: Update README.md

- Add deployment instructions for Vercel
- Document `DEEPSEEK_API_KEY` environment variable setup
- How to connect fork to Vercel (auto-deploy from GitHub)

Files to modify:
- `README.md`

## Verification

- [ ] `api/generate-questions.js` returns valid questions matching the format
- [ ] Generation button appears on quiz setup screen
- [ ] Clicking generates first 5 questions and enters quiz
- [ ] Progressive loading fetches next 5 when 2 remain
- [ ] Reset to original restores built-in questions
- [ ] Domain filter scopes generation
- [ ] Error state shown gracefully on API failure
- [ ] Server rejects count > 5, invalid domain, oversized requests
- [ ] `vercel.json` routes requests correctly
- [ ] Git push triggers Vercel auto-deploy
- [ ] Missing `DEEPSEEK_API_KEY` returns safe error (not crash)
