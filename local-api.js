import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { handleChat, handleVision } from './api/cloudflare-ai.js';
import { handleSpeechToken } from './api/azure-speech.js';
import { handleSystemStatus } from './api/system-status.js';
import { handleSkyfiSearch } from './api/skyfi.js';
import {
  createLiveRuntime,
  registerLiveRuntimeRoutes,
} from './server/live-runtime.js';
import { registerNodeOdmRoutes } from './server/nodeodm-routes.js';

for (const filename of ['.env.local', '.env']) {
  dotenv.config({ path: path.resolve(process.cwd(), filename), quiet: true });
}

const app = express();
const port = Number(process.env.AI_PORT) || 3000;

app.disable('x-powered-by');

const liveRuntime = createLiveRuntime();
registerLiveRuntimeRoutes(app, liveRuntime);
registerNodeOdmRoutes(app);

app.use(express.raw({ type: 'application/json', limit: '8mb' }));

async function sendWebResponse(response, res) {
  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));

  const body = Buffer.from(await response.arrayBuffer());
  return res.send(body);
}

async function runHandler(req, res, handler) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(', '));
      else if (value !== undefined) headers.set(key, value);
    }

    const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method)
        ? undefined
        : req.body,
    });

    return await sendWebResponse(await handler(request), res);
  } catch (error) {
    console.error('Yerel API hatası:', error);
    return res.status(500).json({ error: 'Yerel API isteği işlenemedi.' });
  }
}

app.all('/api/chat', (req, res) => runHandler(req, res, handleChat));
app.all('/api/vision', (req, res) => runHandler(req, res, handleVision));
app.all('/api/speech/token', (req, res) =>
  runHandler(req, res, handleSpeechToken)
);
app.all('/api/system-status', (req, res) =>
  runHandler(req, res, handleSystemStatus)
);
app.all('/api/skyfi', (req, res) => runHandler(req, res, handleSkyfiSearch));
app.get('/health', (_req, res) => {
  // NOT: CLOUDFLARE_AI_TOKEN yerine CLOUDFLARE_API_TOKEN kullanan
  // dağıtımlarla tutarlı olsun diye ikisi de kabul edilir
  // (bkz. api/cloudflare-ai.js#cloudflareApiToken()).
  const hasCloudflare = Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      (process.env.CLOUDFLARE_AI_TOKEN || process.env.CLOUDFLARE_API_TOKEN)
  );
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOllama = Boolean(
    process.env.OLLAMA_BASE_URL || process.env.OLLAMA_ENABLED === 'true'
  );

  // AI sağlayıcı öncelik sırası: Cloudflare → Gemini → Ollama → offline.
  const aiProvider = hasCloudflare
    ? 'cloudflare'
    : hasGemini
      ? 'gemini'
      : hasOllama
        ? 'ollama'
        : 'offline';

  res.json({
    status: 'ok',
    liveRuntime: true,
    nodeOdmUrl: process.env.NODEODM_URL || 'http://127.0.0.1:3001',
    azureSpeechConfigured: Boolean(
      process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION
    ),
    aiProvider,
    aiConfigured: hasCloudflare || hasGemini,
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Uç nokta bulunamadı.' }));
app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'İstek gövdesi izin verilen boyutu aşıyor.' });
  }

  console.error('Yerel API middleware hatası:', error);
  return res.status(400).json({ error: 'İstek işlenemedi.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`SyKaşif yerel AI API: http://127.0.0.1:${port}`);
});
