# Spec

## Problem
The question generation API (`api/generate-questions.js`) currently calls DeepSeek v4 Flash via raw `fetch()` to the DeepSeek API. The user wants to switch the generative model to **Gemini 3.1 Flash Lite** using Google's official Gen AI SDK.

## Solution shape
1. Add `@google/genai` as a project dependency.
2. Replace the `callDeepSeek` function with a `callGemini` function that uses the `GoogleGenAI` SDK (`ai.models.generateContent`).
3. Update `buildPrompt` to emit a single prompt string (or Gemini-compatible content array) instead of the OpenAI-style `messages` array.
4. Replace the `DEEPSEEK_API_KEY` environment variable with `GEMINI_API_KEY`.
5. Update error messages, comments, and the README to reference Gemini instead of DeepSeek.
6. Preserve all existing behaviour: validation, rate-limiting, auth, CORS, retry logic, JSON schema enforcement.

## Key workflows
- `POST /api/generate-questions` validates request → builds prompt → calls Gemini → validates returned JSON → returns questions.
- Retry on invalid JSON: append the bad response + a correction instruction, then call Gemini again.
- Validation retry: if first response fails schema validation, append the bad response + a repair instruction, then call Gemini again.

## Risks
- Gemini 3.1 Flash Lite may not yet be available on the Gemini Developer API (ai.google.dev). Mitigation: the `@google/genai` SDK supports both Gemini Developer API and Vertex AI; we default to Developer API (API key only) but can pivot to Vertex if needed.
- Model string may need adjustment (e.g. `gemini-3.1-flash-lite` vs `gemini-3.1-flash-lite-001`). We'll use the standard model ID `gemini-3.1-flash-lite` as shown in Google docs.
- JSON output reliability: Gemini supports `responseMimeType: 'application/json'` which enforces JSON output, similar to DeepSeek's `response_format: { type: 'json_object' }`.

## Open questions
- None remaining after research.
