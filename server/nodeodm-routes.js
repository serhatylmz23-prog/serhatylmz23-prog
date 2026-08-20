import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import multer from 'multer';

function nodeOdmUrl() {
  return (process.env.NODEODM_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
}
const MAX_FILES = 80;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 600 * 1024 * 1024;
const ALLOWED_ASSETS = new Set([
  'all.zip',
  'orthophoto.tif',
  'orthophoto.png',
  'orthophoto.mbtiles',
  'textured_model.zip',
  'georeferenced_model.las',
  'georeferenced_model.laz',
  'georeferenced_model.ply',
]);

const uploadDir = path.join(os.tmpdir(), 'sykasif-nodeodm-uploads');
await fs.mkdir(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    files: MAX_FILES,
    fileSize: MAX_FILE_BYTES,
    fields: 10,
  },
  fileFilter: (_req, file, callback) => {
    const accepted =
      file.mimetype.startsWith('image/') ||
      /\.(jpe?g|png|tiff?)$/i.test(file.originalname);
    callback(accepted ? null : new Error(`Desteklenmeyen dosya: ${file.originalname}`), accepted);
  },
});

async function nodeOdmFetch(route, init = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${nodeOdmUrl()}${route}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseNodeOdmResponse(response) {
  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    // Genel hata aşağıda üretilecek.
  }
  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || `NodeODM HTTP ${response.status}`
    );
  }
  return payload;
}

async function removeFiles(files) {
  await Promise.allSettled((files || []).map((file) => fs.unlink(file.path)));
}

function cpuSafeOptions(profile) {
  if (profile === 'quality') {
    return [
      { name: 'feature-quality', value: 'medium' },
      { name: 'pc-quality', value: 'medium' },
      { name: 'mesh-size', value: 150000 },
      { name: 'resize-to', value: 3200 },
    ];
  }

  return [
    { name: 'feature-quality', value: 'low' },
    { name: 'pc-quality', value: 'low' },
    { name: 'mesh-size', value: 100000 },
    { name: 'resize-to', value: 2400 },
    { name: 'fast-orthophoto', value: true },
  ];
}

export function registerNodeOdmRoutes(app) {
  app.get('/api/twin/health', async (_req, res) => {
    try {
      const response = await nodeOdmFetch('/info', {}, 5_000);
      const info = await parseNodeOdmResponse(response);
      return res.json({
        online: true,
        engine: 'NodeODM CPU',
        endpoint: nodeOdmUrl(),
        hardwareProfile: 'i3-9100F / 16 GB RAM / Radeon RX 570 — CPU modu',
        limits: {
          maxImages: MAX_FILES,
          maxFileMb: MAX_FILE_BYTES / 1024 / 1024,
          maxTotalMb: MAX_TOTAL_BYTES / 1024 / 1024,
          concurrency: 1,
        },
        info,
      });
    } catch (error) {
      return res.status(503).json({
        online: false,
        engine: 'NodeODM CPU',
        endpoint: nodeOdmUrl(),
        error: error instanceof Error ? error.message : 'NodeODM kullanılamıyor.',
      });
    }
  });

  app.post('/api/twin/tasks', upload.array('images', MAX_FILES), async (req, res) => {
    const files = req.files || [];
    try {
      if (files.length < 3) {
        return res.status(400).json({
          error: 'Fotogrametri için en az 3 örtüşen fotoğraf gerekir; 20+ önerilir.',
        });
      }
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      if (totalBytes > MAX_TOTAL_BYTES) {
        return res.status(413).json({ error: 'Toplam yükleme boyutu 600 MB sınırını aşıyor.' });
      }

      const taskName = String(req.body?.name || `SyKasif-${Date.now()}`)
        .trim()
        .slice(0, 100);
      const profile = req.body?.profile === 'quality' ? 'quality' : 'fast';
      const initForm = new FormData();
      initForm.append('name', taskName);
      initForm.append('options', JSON.stringify(cpuSafeOptions(profile)));
      const initResponse = await nodeOdmFetch('/task/new/init', {
        method: 'POST',
        body: initForm,
      });
      const initialized = await parseNodeOdmResponse(initResponse);
      const uuid = initialized?.uuid;
      if (!uuid || !/^[\w-]+$/.test(uuid)) {
        throw new Error('NodeODM görev kimliği döndürmedi.');
      }

      for (const file of files) {
        const bytes = await fs.readFile(file.path);
        const form = new FormData();
        form.append(
          'images',
          new Blob([bytes], { type: file.mimetype || 'application/octet-stream' }),
          file.originalname
        );
        const uploadResponse = await nodeOdmFetch(
          `/task/new/upload/${encodeURIComponent(uuid)}`,
          { method: 'POST', body: form },
          120_000
        );
        await parseNodeOdmResponse(uploadResponse);
      }

      const commitResponse = await nodeOdmFetch(
        `/task/new/commit/${encodeURIComponent(uuid)}`,
        { method: 'POST' },
        30_000
      );
      await parseNodeOdmResponse(commitResponse);

      return res.status(201).json({
        uuid,
        name: taskName,
        profile,
        imageCount: files.length,
        totalMb: Number((totalBytes / 1024 / 1024).toFixed(1)),
        status: 'queued',
      });
    } catch (error) {
      console.error('NodeODM görev hatası:', error);
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'Dijital ikiz görevi oluşturulamadı.',
      });
    } finally {
      await removeFiles(files);
    }
  });

  app.get('/api/twin/tasks/:uuid', async (req, res) => {
    if (!/^[\w-]+$/.test(req.params.uuid)) {
      return res.status(400).json({ error: 'Geçersiz görev kimliği.' });
    }
    try {
      const response = await nodeOdmFetch(
        `/task/${encodeURIComponent(req.params.uuid)}/info`
      );
      return res.json(await parseNodeOdmResponse(response));
    } catch (error) {
      return res.status(502).json({
        error: error instanceof Error ? error.message : 'Görev bilgisi alınamadı.',
      });
    }
  });

  app.get('/api/twin/tasks/:uuid/download/:asset', async (req, res) => {
    if (!/^[\w-]+$/.test(req.params.uuid) || !ALLOWED_ASSETS.has(req.params.asset)) {
      return res.status(400).json({ error: 'Geçersiz görev veya çıktı adı.' });
    }
    try {
      const response = await nodeOdmFetch(
        `/task/${encodeURIComponent(req.params.uuid)}/download/${encodeURIComponent(req.params.asset)}`,
        {},
        10 * 60 * 1_000
      );
      if (!response.ok || !response.body) {
        throw new Error(`NodeODM çıktı indirme hatası: HTTP ${response.status}`);
      }
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!['connection', 'transfer-encoding'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${req.params.uuid}-${req.params.asset}"`
      );
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      return res.end();
    } catch (error) {
      if (!res.headersSent) {
        return res.status(502).json({
          error: error instanceof Error ? error.message : 'Çıktı indirilemedi.',
        });
      }
      return res.end();
    }
  });

  app.use((error, _req, res, next) => {
    if (!(error instanceof multer.MulterError) && !String(error?.message).includes('Desteklenmeyen')) {
      return next(error);
    }
    return res.status(400).json({ error: error.message });
  });
}
