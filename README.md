# Claude Certified Architect — Foundations Exam Prep

Internal study kit for Kibo AI team members preparing for the **Claude Certified Architect — Foundations** certification.

## What's Inside

| File | Description |
|------|-------------|
| `index.html` | Resource hub — cheat sheets, study links |
| `quiz.html` | Practice exam with original questions + AI generation |
| `api/generate-questions.js` | Vercel serverless function (DeepSeek v4 Flash proxy) |
| `Claude Certified Architect – Cheat Sheet.docx` | 8-page reference covering all 5 domains (Word) |
| `Claude Certified Architect – Cheat Sheet.pdf` | Same reference in PDF format |

## How to Use (Static — No Backend)

1. Clone or download this repo
2. Open `index.html` in your browser — everything runs locally
3. Original ~40 questions work offline
4. **AI question generation requires deployment** (see below)

## How to Deploy (Vercel)

This project is set up for Vercel deployment with serverless question generation via DeepSeek v4 Flash.

### One-click Deployment

1. Push this repo to GitHub
2. Connect to Vercel: [vercel.com/new](https://vercel.com/new)
3. Select your GitHub repo — auto-detects settings
4. Add environment variable:
   - `DEEPSEEK_API_KEY` — your DeepSeek API key (get one at [platform.deepseek.com](https://platform.deepseek.com))
5. Deploy! Auto-deploys on every push to main

### Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally (serves static + api/ functions)
vercel dev
```

Then open `http://localhost:3000` — the generation endpoint will hit DeepSeek using your env vars.

## Features

- **Original Questions**: ~40 hand-crafted exam questions across all 5 domains
- **AI Generation**: Select "Generate New" on quiz.html, pick your count (5-40), questions are generated in batches of 5 via DeepSeek v4 Flash with thinking mode
- **Progressive Loading**: Questions appear as soon as the first 5 are ready — remaining batches load in the background
- **Domain Filter**: Generate questions for a specific domain or all domains
- **Reset to Original**: Always revert back to the built-in question pool

## Exam Quick Facts

- **Format:** Multiple choice · 1 correct out of 4
- **Passing score:** 720 out of 1000
- **Guessing penalty:** None — always answer every question
- **Scenarios:** 4 randomly selected out of 8 possible

## Domains & Weights

| # | Domain | Weight |
|---|--------|--------|
| 1 | Agentic Architecture & Orchestration | 27% |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

## External Resources

- [Kibo-AI GitHub](https://github.com/Kibo-AI/claude-certified-architect) — Aggregated study guides and courses
- [mrKindly GitHub](https://github.com/mrKindly/claude-certified-architect) — Near-real exam questions with solutions
- [claude-guides.com](https://claude-guides.com/) — Quick-reference guides
- [claudecertified.io/knowledge](https://claudecertified.io/knowledge) — Study material & mock exams
- [claudecertificationguide.com/learn](https://claudecertificationguide.com/learn) — Full syllabus coverage
- [claudecertprep.com/overview](https://claudecertprep.com/overview) — Practice tests
- [claudecertifications.com](https://claudecertifications.com/claude-certified-architect/study-guide) — Official study guide
