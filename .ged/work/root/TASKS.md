# Tasks

## Task slices

| ID | Title | Depends On | Status | Done Criteria |
| --- | --- | --- | --- | --- |
| T1 | Add `@google/genai` dependency to `package.json` | — | pending | `package.json` lists `@google/genai` with a caret semver range. |
| T2 | Rewrite `api/generate-questions.js` to use Gemini SDK | T1 | pending | File compiles mentally: imports `GoogleGenAI`, uses `ai.models.generateContent`, model set to `gemini-3.1-flash-lite`, `GEMINI_API_KEY` env var, retry logic adapted, no DeepSeek references remain. |
| T3 | Update README deployment docs | T2 | pending | README mentions `GEMINI_API_KEY` from Google AI Studio and `gemini-3.1-flash-lite`. |
| T4 | Verify syntax and consistency | T2, T3 | pending | No references to `DEEPSEEK_API_KEY` or `deepseek` remain in the repo. |
