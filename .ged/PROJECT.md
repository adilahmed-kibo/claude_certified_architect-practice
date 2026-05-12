# Project

## Goal

Turn the Claude Certified Architect study kit (static HTML/JS) into a Vercel-hosted app with serverless question generation via DeepSeek v4 Flash API.

## Users

- Primary users: Kibo AI team members preparing for the Claude Certified Architect — Foundations certification
- Secondary users: Anyone studying for the certification

## Constraints

- Technical constraints:
  - API key must stay server-side (Vercel environment variables)
  - Must work as static HTML/JS on Vercel with API functions
  - Existing questions (~40) must remain available as "original" pool
  - DeepSeek v4 Flash uses thinking mode (high/xhigh/max)
- Product constraints:
  - No auth/login required (public study tool)
  - Free-tier-friendly on Vercel

## Success Criteria

- Users can generate new practice questions on demand
- Questions generated in batches of 5 with progressive loading
- Same question format as existing pool (domain, scenario, situation, 4 options, correct, explanation)
- Domain filter applies to generation
- Original questions always resettable
- Vercel deployment auto-deploys from GitHub on push

## Repo Signals

- Detected languages: HTML, JavaScript, CSS
- Detected frameworks: none (static)
- Detected tools: Vercel (target), DeepSeek API (target)
