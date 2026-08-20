import express from 'express';

const SYNC_INTERVAL_MS = 5 * 60 * 1_000;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_EVENTS = 150;
const MAX_DYNAMIC_AGENTS = 40;

function now() {
  return new Date().toISOString();
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SyKasif-Live-Runtime/0.2',
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function earthquakeSeverity(magnitude) {
  if (magnitude >= 6) return 'critical';
  if (magnitude >= 5) return 'high';
  if (magnitude >= 3) return 'medium';
  return 'low';
}

function normalizeEarthquakes(payload) {
  return (payload.features || []).slice(0, 100).map((feature) => {
    const [lng, lat, depth] = feature.geometry?.coordinates || [];
    const magnitude = Number(feature.properties?.mag || 0);
    return {
      id: `usgs:${feature.id}`,
      sourceId: 'usgs-earthquake',
      category: 'earthquake',
      title: feature.properties?.title || feature.properties?.place || 'Deprem',
      summary: `M${magnitude.toFixed(1)} • Derinlik ${Number(depth || 0).toFixed(1)} km`,
      severity: earthquakeSeverity(magnitude),
      lat: Number(lat),
      lng: Number(lng),
      observedAt: new Date(feature.properties?.time || Date.now()).toISOString(),
      url: feature.properties?.url || null,
      data: { magnitude, depthKm: Number(depth || 0) },
    };
  });
}

const EONET_SEVERITY = {
  Wildfires: 'high',
  Volcanoes: 'high',
  'Severe Storms': 'high',
  Floods: 'medium',
  Landslides: 'medium',
  Earthquakes: 'high',
};

function normalizeEonet(payload) {
  return (payload.events || []).flatMap((event) => {
    const geometry = event.geometry?.at(-1);
    const coordinates = geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
    const category = event.categories?.[0]?.title || 'Natural Event';
    return [{
      id: `eonet:${event.id}`,
      sourceId: 'nasa-eonet',
      category: category.toLocaleLowerCase('en-US').replace(/\s+/g, '-'),
      title: event.title || category,
      summary: `${category} • NASA EONET açık olay`,
      severity: EONET_SEVERITY[category] || 'medium',
      lat: Number(coordinates[1]),
      lng: Number(coordinates[0]),
      observedAt: geometry.date || event.geometry?.[0]?.date || now(),
      url: event.link || null,
      data: { category },
    }];
  });
}

function normalizeGdacs(payload) {
  const severityMap = { Red: 'critical', Orange: 'high', Green: 'medium' };
  return (payload.features || []).slice(0, 100).flatMap((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties || {};
    if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
    const eventType = properties.eventtype || 'DISASTER';
    return [{
      id: `gdacs:${eventType}:${properties.eventid}:${properties.episodeid || 0}`,
      sourceId: 'gdacs-disasters',
      category: `gdacs-${String(eventType).toLocaleLowerCase('en-US')}`,
      title: properties.name || properties.description || 'GDACS Olayı',
      summary: `${properties.alertlevel || 'Bilinmeyen'} uyarı • ${properties.country || 'Küresel'}`,
      severity: severityMap[properties.alertlevel] || 'low',
      lat: Number(coordinates[1]),
      lng: Number(coordinates[0]),
      observedAt: properties.fromdate || properties.datemodified || now(),
      url: properties.url?.report || properties.url?.details || null,
      data: {
        eventType,
        alertLevel: properties.alertlevel,
        country: properties.country,
      },
    }];
  });
}

const SOURCE_DEFINITIONS = [
  {
    id: 'usgs-earthquake',
    name: 'USGS Earthquake Catalog',
    provider: 'USGS',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    intervalMinutes: 5,
    normalize: normalizeEarthquakes,
  },
  {
    id: 'nasa-eonet',
    name: 'NASA EONET',
    provider: 'NASA',
    url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100',
    intervalMinutes: 10,
    normalize: normalizeEonet,
  },
  {
    id: 'gdacs-disasters',
    name: 'GDACS Global Disaster Alerts',
    provider: 'GDACS / European Commission',
    url: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP',
    intervalMinutes: 10,
    normalize: normalizeGdacs,
  },
];

export function createLiveRuntime() {
  const clients = new Set();
  const sourceStates = new Map(
    SOURCE_DEFINITIONS.map((source) => [
      source.id,
      {
        id: source.id,
        name: source.name,
        provider: source.provider,
        status: 'waiting',
        eventCount: 0,
        lastSyncAt: null,
        error: null,
        trusted: true,
      },
    ])
  );
  const eventsBySource = new Map();
  const approvals = [];
  let syncing = false;
  let lastUpdatedAt = null;

  function buildAgents(events) {
    const sourceAgents = [...sourceStates.values()].map((source) => ({
      id: `source-agent:${source.id}`,
      kind: 'source',
      name: `${source.provider} Kaynak Ajanı`,
      status:
        source.status === 'online'
          ? 'active'
          : source.status === 'syncing'
            ? 'syncing'
            : source.status === 'error'
              ? 'error'
              : 'waiting',
      sourceId: source.id,
      eventId: null,
      category: 'source',
      lastUpdatedAt: source.lastSyncAt,
      detail: source.error || `${source.eventCount} canlı kayıt`,
    }));

    const priority = { critical: 4, high: 3, medium: 2, low: 1 };
    const dynamicAgents = [...events]
      .sort((a, b) => {
        const severity = priority[b.severity] - priority[a.severity];
        if (severity !== 0) return severity;
        return Date.parse(b.observedAt) - Date.parse(a.observedAt);
      })
      .slice(0, MAX_DYNAMIC_AGENTS)
      .map((event) => ({
        id: `event-agent:${event.id}`,
        kind: 'event',
        name: `${event.category.replace(/-/g, ' ')} İzleme Ajanı`,
        status: 'active',
        sourceId: event.sourceId,
        eventId: event.id,
        category: event.category,
        lastUpdatedAt: event.observedAt,
        detail: event.title,
      }));

    return [...sourceAgents, ...dynamicAgents];
  }

  function snapshot() {
    const events = [...eventsBySource.values()]
      .flatMap((sourceEvents) => sourceEvents.slice(0, 50))
      .filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))
      .slice(0, MAX_EVENTS);
    const agents = buildAgents(events);

    return {
      mode: 'live',
      generatedAt: now(),
      lastUpdatedAt,
      syncing,
      agents,
      sources: [...sourceStates.values()],
      events,
      approvals: approvals.filter((item) => item.status === 'pending'),
      metrics: {
        activeAgents: agents.filter((agent) => agent.status === 'active').length,
        syncingAgents: agents.filter((agent) => agent.status === 'syncing').length,
        errorAgents: agents.filter((agent) => agent.status === 'error').length,
        liveEvents: events.length,
        onlineSources: [...sourceStates.values()].filter(
          (source) => source.status === 'online'
        ).length,
        pendingApprovals: approvals.filter((item) => item.status === 'pending').length,
      },
    };
  }

  function publish(type = 'snapshot') {
    const message = `event: ${type}\ndata: ${JSON.stringify(snapshot())}\n\n`;
    for (const response of clients) {
      try {
        response.write(message);
      } catch {
        clients.delete(response);
      }
    }
  }

  async function sync(force = false) {
    if (syncing && !force) return snapshot();
    syncing = true;
    publish('sync-start');

    await Promise.all(
      SOURCE_DEFINITIONS.map(async (definition) => {
        const state = sourceStates.get(definition.id);
        state.status = 'syncing';
        state.error = null;
        publish('source-update');

        try {
          const payload = await fetchJson(definition.url);
          const events = definition.normalize(payload);
          eventsBySource.set(definition.id, events);
          state.status = 'online';
          state.eventCount = events.length;
          state.lastSyncAt = now();
        } catch (error) {
          state.status = 'error';
          state.error =
            error instanceof Error ? error.message : 'Bilinmeyen kaynak hatası';
          state.lastSyncAt = now();
        }
      })
    );

    syncing = false;
    lastUpdatedAt = now();
    publish('snapshot');
    return snapshot();
  }

  function connect(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();
    clients.add(response);
    response.write(`event: snapshot\ndata: ${JSON.stringify(snapshot())}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        response.write(`event: heartbeat\ndata: ${JSON.stringify({ at: now() })}\n\n`);
      } catch {
        clearInterval(heartbeat);
        clients.delete(response);
      }
    }, 20_000);

    request.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(response);
    });
  }

  function decideApproval(id, decision) {
    const item = approvals.find((approval) => approval.id === id);
    if (!item) return null;
    item.status = decision;
    item.decidedAt = now();
    publish('approval-update');
    return item;
  }

  function proposeSource(candidate) {
    const approval = {
      id: crypto.randomUUID(),
      type: 'source',
      title: candidate.title,
      description: candidate.description,
      payload: candidate,
      status: 'pending',
      createdAt: now(),
      decidedAt: null,
    };
    approvals.unshift(approval);
    publish('approval-update');
    return approval;
  }

  const timer = setInterval(() => void sync(), SYNC_INTERVAL_MS);
  timer.unref?.();
  void sync();

  return {
    snapshot,
    sync,
    connect,
    decideApproval,
    proposeSource,
  };
}

export function registerLiveRuntimeRoutes(app, runtime) {
  app.get('/api/runtime/snapshot', (_req, res) => res.json(runtime.snapshot()));
  app.get('/api/runtime/stream', (req, res) => runtime.connect(req, res));
  app.post('/api/runtime/sync', async (_req, res) => {
    res.json(await runtime.sync(true));
  });
  app.post('/api/runtime/approvals/:id/:decision', (req, res) => {
    if (!['approved', 'rejected'].includes(req.params.decision)) {
      return res.status(400).json({ error: 'Karar approved veya rejected olmalıdır.' });
    }
    const result = runtime.decideApproval(req.params.id, req.params.decision);
    if (!result) return res.status(404).json({ error: 'Onay kaydı bulunamadı.' });
    return res.json(result);
  });
  app.post('/api/runtime/source-proposals', express.json({ limit: '32kb' }), (req, res) => {
    const title = String(req.body?.title || '').trim();
    const url = String(req.body?.url || '').trim();
    if (!title || !/^https:\/\//i.test(url)) {
      return res.status(400).json({ error: 'Başlık ve HTTPS kaynak URL’si zorunludur.' });
    }
    return res.status(201).json(
      runtime.proposeSource({
        title,
        url,
        description: String(req.body?.description || '').trim(),
      })
    );
  });
}
