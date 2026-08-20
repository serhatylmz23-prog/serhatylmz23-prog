// local-proxy.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
app.use(express.text({ type: '*/*' }));

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

app.all('/api/cloudflare-proxy/:path(*)', async (req, res) => {
  const token = process.env.CLOUDFLARE_AI_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';

  // Presence check (only boolean/length logged — do NOT log token itself)
  console.log('TOKEN_PRESENT:', !!token);
  console.log('TOKEN_LENGTH:', token ? token.length : 0);

  if (!token) return res.status(500).json({ error: 'Missing Cloudflare token (set .env.local or Vercel env)' });

  // req.params.path captures everything after /api/cloudflare-proxy/
  const pathSuffix = '/' + (req.params.path || '');
  const allowed = ['/accounts','/zones','/workers', `/accounts/${accountId}`];
  if (!allowed.some(p => pathSuffix === p || pathSuffix.startsWith(p + '/'))) {
    return res.status(400).json({ error: 'Path not allowed', path: pathSuffix });
  }

  const target = `https://api.cloudflare.com/client/v4${pathSuffix}`;
  console.log('Forward target:', target);

  const headers = { Authorization: `Bearer ${token}` };
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];

  try {
    const cfRes = await fetch(target, { method: req.method, headers, body: req.body });
    const text = await cfRes.text();
    res.status(cfRes.status);
    const json = safeJsonParse(text);
    if (json) return res.json(json);
    return res.send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Local Cloudflare proxy running: http://localhost:${PORT}/api/cloudflare-proxy/`));
