// api/cloudflare-proxy.js
// Basit, güvenli bir proxy: frontend'ten gelen istekleri Cloudflare API'ine iletir.
// NOT: Bu kod örnektir — production'da ekstra rate-limit, auth ve input validation eklemelisiniz.

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
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    return res.status(500).json({ error: 'Missing Cloudflare token on server' });
  }

  // Güvenlik: yalnızca izin verdiğiniz Cloudflare yollarına izin verin
  const allowedPrefixes = [
    '/accounts',
    '/zones',
    '/workers',
    '/accounts/' + (accountId || '')
  ];
  const path = (req.url || '').replace(/^\/api\/cloudflare-proxy/, '') || '/';
  if (!allowedPrefixes.some(p => path === p || path.startsWith(p + '/'))) {
    return res.status(400).json({ error: 'Path not allowed' });
  }

  const target = `https://api.cloudflare.com/client/v4${path}`;

  // Hazır header'lar (istek içeriğine göre Content-Type ekliyoruz)
  const forwardHeaders = {
    Authorization: `Bearer ${token}`,
  };
  if (req.headers['content-type']) forwardHeaders['Content-Type'] = req.headers['content-type'];

  // Gövdeyi oku (GET/HEAD için gövde yok)
  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const raw = await readRawBody(req);
    body = raw ? raw : undefined;
  }

  try {
    const cfRes = await fetch(target, {
      method: req.method,
      headers: forwardHeaders,
      body
    });

    // Başlıkları kopyala (hop-by-hop başlıkları atla)
    cfRes.headers.forEach((value, key) => {
      const hopByHop = ['connection','keep-alive','transfer-encoding','upgrade','proxy-authorization','proxy-authenticate','te'];
      if (!hopByHop.includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const text = await cfRes.text();
    res.status(cfRes.status);
    // Eğer JSON görünüyorsa JSON olarak gönder
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      return res.send(text);
    }
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Bad gateway', details: err.message });
  }
}
