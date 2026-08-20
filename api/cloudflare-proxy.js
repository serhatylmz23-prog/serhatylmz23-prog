// api/cloudflare-proxy.js
async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  const token = process.env.CLOUDFLARE_AI_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';

  // DEBUG: token var mı ve uzunluğu (token'ı asla loglama)
  console.log('TOKEN_PRESENT:', !!token);
  console.log('TOKEN_LENGTH:', token ? token.length : 0);

  if (!token) {
    return res.status(500).json({ error: 'Missing Cloudflare token on server' });
  }

  // güvenli path çıkarımı
  const prefix = '/api/cloudflare-proxy';
  let rawUrl = req.url || '/';
  // bazı ortamlarda req.url query ile geliyor; sadece pathname'i elde etmeye çalış:
  const path = rawUrl.startsWith(prefix) ? rawUrl.slice(prefix.length) || '/' : rawUrl;

  // izin verilen prefixler
  const allowedPrefixes = [
    '/accounts',
    '/zones',
    '/workers',
    `/accounts/${accountId}`
  ];
  if (!allowedPrefixes.some(p => path === p || path.startsWith(p + '/'))) {
    console.log('Path not allowed:', path);
    return res.status(400).json({ error: 'Path not allowed', path });
  }

  const target = `https://api.cloudflare.com/client/v4${path}`;
  console.log('Forward target:', target);

  const forwardHeaders = {
    Authorization: `Bearer ${token}`,
  };
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const raw = await readRawBody(req);
    body = raw ? raw : undefined;
  }

  try {
    const cfRes = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body,
    });

    // forward non-hop-by-hop headers
    cfRes.headers.forEach((value, key) => {
      const hopByHop = ['connection','keep-alive','transfer-encoding','upgrade','proxy-authorization','proxy-authenticate','te'];
      if (!hopByHop.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const text = await cfRes.text();
    res.status(cfRes.status);
    try { return res.json(JSON.parse(text)); } catch { return res.send(text); }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Bad gateway', details: err.message });
  }
}
