// Vercel serverless function — password authentication
// POST /api/auth
// Body: { password: string }
// Returns: { ok: true } | { ok: false, error: string }

export default async function handler(req, res) {
  // CORS headers — must be set before any early return
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    // No password configured = no auth required
    return res.status(200).json({ ok: true });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(401).json({ ok: false, error: 'Password required' });
  }

  if (password === appPassword) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Invalid password' });
}
