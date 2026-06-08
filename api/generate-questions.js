// Vercel serverless function — generates practice questions via Gemini 3.1 Flash Lite
// POST /api/generate-questions

import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3.1-flash-lite';

// ── Few-shot examples (representative questions from the existing pool) ──────────
const FEW_SHOT_EXAMPLES = [
  {
    domain: 1,
    scenario: 'Customer Support Agent',
    situation: 'Your agent loop runs, but it sometimes stops before the task is complete — specifically when Claude returns a response with both text content AND a tool call.',
    question: 'What is the ONLY reliable signal to stop an agentic loop?',
    options: [
      'stop_reason === "end_turn"',
      'The assistant message contains explanatory text',
      'A maximum iteration counter (e.g., max_iterations = 5) is reached',
      'Parsing assistant text for phrases like "Task completed"'
    ],
    correct: 0,
    explanation: 'stop_reason is Claude\'s explicit structured signal. "end_turn" = done. "tool_use" = keep looping. Text content, iteration counts, and parsed phrases are all unreliable anti-patterns.'
  },
  {
    domain: 2,
    scenario: 'Customer Support Agent',
    situation: 'The agent often calls get_customer for order-related questions. Both get_customer and lookup_order have minimal descriptions and accept similar identifier formats.',
    question: 'What is the FIRST step to improve tool selection reliability?',
    options: [
      'Implement a routing classifier before each turn',
      'Combine both tools into a single lookup_entity',
      'Add few-shot examples demonstrating correct tool selection',
      "Expand each tool's description with input formats, example queries, edge cases, and boundaries"
    ],
    correct: 3,
    explanation: 'Tool descriptions are the PRIMARY selection mechanism. Minimal descriptions are the root cause. This is the lowest-effort, highest-impact fix. Classifiers and merging are overengineering.'
  },
  {
    domain: 5,
    scenario: 'Customer Support Agent',
    situation: 'The agent achieves 55% first-contact resolution (target: 80%). It escalates simple cases and handles complex policy exceptions autonomously.',
    question: 'What is the most effective way to improve escalation calibration?',
    options: [
      'Require the agent to self-rate confidence 1–10 and auto-route below a threshold',
      'Deploy a separate classifier model trained on historical tickets',
      'Add explicit escalation criteria to the system prompt with few-shot examples',
      'Implement sentiment analysis to detect customer frustration'
    ],
    correct: 2,
    explanation: 'Explicit criteria with few-shot examples directly fix the root cause: unclear decision boundaries. Self-rated confidence (A) is unreliable — the model can be confidently wrong. Sentiment ≠ case complexity.'
  }
];

const DOMAIN_INFO = {
  1: { name: 'Agentic Architecture & Orchestration', weight: '27%' },
  2: { name: 'Tool Design & MCP Integration', weight: '18%' },
  3: { name: 'Claude Code Configuration & Workflows', weight: '20%' },
  4: { name: 'Prompt Engineering & Structured Output', weight: '20%' },
  5: { name: 'Context Management & Reliability', weight: '15%' }
};

// ── Request validation ─────────────────────────────────────────────────────────
function validateRequest(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const count = Number(body.count);
  if (!Number.isInteger(count) || count < 1 || count > 5) {
    errors.push('count must be an integer between 1 and 5');
  }

  if (body.domain !== 'all' && ![1, 2, 3, 4, 5].includes(Number(body.domain))) {
    errors.push('domain must be "all" or an integer 1-5');
  }

  if (body.questionsSoFar && !Array.isArray(body.questionsSoFar)) {
    errors.push('questionsSoFar must be an array if provided');
  }

  return { valid: errors.length === 0, errors, count: Number(count), domain: body.domain === 'all' ? 'all' : Number(body.domain) };
}

// ── Build the system prompt ────────────────────────────────────────────────────
function buildPrompt(domain, count, questionsSoFar) {
  const domainList = Object.entries(DOMAIN_INFO)
    .map(([k, v]) => `  Domain ${k}: ${v.name} (${v.weight})`)
    .join('\n');

  let domainInstruction;
  if (domain === 'all') {
    domainInstruction = `Generate a diverse mix across ALL 5 domains. Distribute the ${count} questions roughly proportional to each domain's weight.`;
  } else {
    domainInstruction = `All questions MUST be about Domain ${domain}: ${DOMAIN_INFO[domain].name}.`;
  }

  const fewShotJson = JSON.stringify(FEW_SHOT_EXAMPLES, null, 2);

  let contextNote = '';
  if (questionsSoFar && questionsSoFar.length > 0) {
    contextNote = `\nNOTE: You already generated ${questionsSoFar.length} questions earlier in this session. Do NOT repeat or closely paraphrase those. Here are their questions:\n${questionsSoFar.map(q => `- "${q.question}"`).join('\n')}\n`;
  }

  return `You are an expert exam question generator for the "Claude Certified Architect — Foundations" certification.

## Certification Domains
${domainList}

## Task
Generate ${count} high-quality multiple-choice practice exam questions. Each question tests real understanding of Claude/AI agent architecture concepts — not trivia.

${domainInstruction}
${contextNote}
## Output Format
Return a JSON object with this exact schema:
{
  "questions": [
    {
      "domain": <integer 1-5>,
      "scenario": "<short scenario label like 'Customer Support Agent' or 'Multi-agent Research System' or 'Code Generation'>",
      "situation": "<2-4 sentence context describing the scenario>",
      "question": "<the exam question>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "correct": <integer 0-3 (index of correct option)>,
      "explanation": "<detailed explanation of why this is correct and why others are wrong>"
    }
  ]
}

## Quality Guidelines
- Questions should be at exam difficulty: nuanced, testing understanding not memorization
- Each correct answer should be unambiguously correct
- Wrong answers (distractors) should be plausible but clearly inferior once you know the concept
- Explanations should be 2-6 sentences: state the correct answer, explain why, and note key exam traps
- Scenarios should be realistic and varied (don't repeat the same scenario type)
- Domain must match the assigned domain(s)

## Few-Shot Examples
Here are 3 example questions at the correct level of quality and format:

${fewShotJson}

## Critical Rules
- Return ONLY valid JSON. No markdown, no code fences, no extra text before or after.
- The JSON must have a top-level "questions" array.
- Exactly ${count} questions in the array.
- Each question must have ALL fields: domain, scenario, situation, question, options (exactly 4), correct (0-3), explanation.`;
}

// ── Validate Gemini response ──────────────────────────────────────────────────
function validateQuestions(questions, expectedCount, requestedDomain) {
  if (!Array.isArray(questions) || questions.length !== expectedCount) {
    return { valid: false, error: `Expected ${expectedCount} questions, got ${questions?.length || 0}` };
  }

  const errors = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const idx = i + 1;

    const domain = Number(q.domain);
    if (!domain || ![1, 2, 3, 4, 5].includes(domain)) {
      errors.push(`Question ${idx}: invalid or missing domain`);
    } else if (requestedDomain !== 'all' && domain !== requestedDomain) {
      errors.push(`Question ${idx}: domain ${domain} does not match requested domain ${requestedDomain}`);
    }
    if (!q.scenario || typeof q.scenario !== 'string') {
      errors.push(`Question ${idx}: missing or invalid scenario`);
    }
    if (!q.situation || typeof q.situation !== 'string') {
      errors.push(`Question ${idx}: missing or invalid situation`);
    }
    if (!q.question || typeof q.question !== 'string') {
      errors.push(`Question ${idx}: missing or invalid question`);
    }
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some(o => typeof o !== 'string')) {
      errors.push(`Question ${idx}: options must be an array of exactly 4 strings`);
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3 || !Number.isInteger(q.correct)) {
      errors.push(`Question ${idx}: correct must be an integer 0-3`);
    }
    if (!q.explanation || typeof q.explanation !== 'string') {
      errors.push(`Question ${idx}: missing or invalid explanation`);
    }
  }

  return { valid: errors.length === 0, error: errors.length > 0 ? errors.join('; ') : null };
}

// ── Call Gemini API ───────────────────────────────────────────────────────────
async function callGemini(contents, retries = 1) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { ok: false, error: 'GEMINI_API_KEY is not configured on the server' };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;

    if (!text) {
      return { ok: false, error: 'Gemini returned empty response' };
    }

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      if (retries > 0) {
        // Build a conversation from the original contents for retry
        let conversation;
        if (typeof contents === 'string') {
          conversation = [{ role: 'user', parts: [{ text: contents }] }];
        } else {
          conversation = contents;
        }

        conversation.push({ role: 'model', parts: [{ text }] });
        conversation.push({
          role: 'user',
          parts: [{ text: 'Your response was not valid JSON. Return ONLY valid JSON matching the schema described earlier. No markdown, no code fences, no extra text.' }]
        });

        return callGemini(conversation, retries - 1);
      }
      return { ok: false, error: 'Gemini returned invalid JSON that could not be parsed' };
    }

    return { ok: true, parsed };
  } catch (err) {
    return { ok: false, error: `Gemini API error: ${err.message}` };
  }
}

// ── Simple in-memory rate limiter ──────────────────────────────────────────────
const requestTimestamps = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const last = requestTimestamps.get(ip) || 0;
  if (now - last < 1000) { // 1 request per second per IP
    return false;
  }
  requestTimestamps.set(ip, now);
  return true;
}

// ── Auth check ────────────────────────────────────────────────────────────────
function requireAuth(req) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return null; // No password configured = open access

  const token = req.headers['x-auth-token'];
  if (!token) return 'Authentication required. Set APP_PASSWORD env var and provide x-auth-token header.';

  let decoded;
  try {
    decoded = Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    return 'Invalid auth token';
  }

  if (decoded !== appPassword) {
    return 'Invalid authentication';
  }

  return null; // Auth OK
}

// ── CORS helper ──────────────────────────────────────────────────────────────
function setCorsHeaders(req, res) {
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://claude-certified-architect-practice.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://eduard-gyarmati-kibo.github.io'
  ];

  const isAllowed = allowedOrigins.some(a => origin.startsWith(a))
    || /^https:\/\/claude-certified-architect-practice-[a-z0-9-]+\.vercel\.app$/.test(origin);

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-auth-token');
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS headers must be set BEFORE any early return for browser compatibility
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth check
  const authError = requireAuth(req);
  if (authError) {
    return res.status(401).json({ error: authError });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  // Validate request
  const validation = validateRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors.join('; ') });
  }

  const { count, domain } = validation;
  const questionsSoFar = Array.isArray(req.body.questionsSoFar) ? req.body.questionsSoFar : [];

  // Build prompt
  const prompt = buildPrompt(domain, count, questionsSoFar);

  // Call Gemini
  const result = await callGemini(prompt);

  if (!result.ok) {
    return res.status(502).json({ error: result.error });
  }

  // Validate response structure
  const questions = result.parsed.questions || result.parsed;
  const validationResult = validateQuestions(questions, count, domain);

  if (!validationResult.valid) {
    // One retry with explicit repair instruction
    const repairConversation = [
      { role: 'user', parts: [{ text: prompt }] },
      { role: 'model', parts: [{ text: JSON.stringify(result.parsed) }] },
      {
        role: 'user',
        parts: [{
          text: `Your response failed validation: ${validationResult.error}. Please fix and return valid JSON matching this exact schema:

{
  "questions": [
    {
      "domain": <integer 1-5>,
      "scenario": "<string>",
      "situation": "<string>",
      "question": "<string>",
      "options": ["<A>", "<B>", "<C>", "<D>"],
      "correct": <0-3>,
      "explanation": "<string>"
    }
  ]
}

Return exactly ${count} questions. ONLY JSON, no other text.`
        }]
      }
    ];

    const retryResult = await callGemini(repairConversation, 0);
    if (!retryResult.ok) {
      return res.status(502).json({ error: `Generated questions failed validation: ${validationResult.error}` });
    }

    const retryQuestions = retryResult.parsed.questions || retryResult.parsed;
    const retryValidation = validateQuestions(retryQuestions, count, domain);
    if (!retryValidation.valid) {
      return res.status(502).json({ error: `Generated questions failed validation after retry: ${retryValidation.error}` });
    }

    return res.status(200).json({ questions: retryQuestions, sessionId: Date.now().toString(36) });
  }

  return res.status(200).json({ questions, sessionId: Date.now().toString(36) });
}
