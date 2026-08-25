interface RuntimeQueryResult<T = Record<string, unknown>> {
  results: T[];
  meta: { changes?: number; [key: string]: unknown };
}

interface RuntimePreparedStatement {
  bind(...values: unknown[]): RuntimePreparedStatement;
  run(): Promise<RuntimeQueryResult>;
  all<T = Record<string, unknown>>(): Promise<RuntimeQueryResult<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
}

interface RuntimeDatabase {
  prepare(query: string): RuntimePreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: RuntimePreparedStatement[]
  ): Promise<RuntimeQueryResult<T>[]>;
}

interface RuntimeDurableObjectStub {
  fetch(input: string | Request | URL, init?: RequestInit): Promise<Response>;
}

interface RuntimeDurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RuntimeDurableObjectStub;
}

interface Env {
  DB: RuntimeDatabase;
  LIVE_HUB: RuntimeDurableObjectNamespace;
  APP_ORIGIN: string;
  ADMIN_TOKEN?: string;
}

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface RuntimeEvent {
  id: string;
  sourceId: string;
  category: string;
  title: string;
  summary: string;
  severity: Severity;
  lat: number;
  lng: number;
  observedAt: string;
  url: string | null;
  data: Record<string, unknown>;
}

interface SourceDefinition {
  id: string;
  name: string;
  provider: string;
  url: string;
  normalize: (payload: any) => RuntimeEvent[];
}

function now(): string {
  return new Date().toISOString();
}

function earthquakeSeverity(magnitude: number): Severity {
  if (magnitude >= 6) return 'critical';
  if (magnitude >= 5) return 'high';
  if (magnitude >= 3) return 'medium';
  return 'low';
}

function normalizeEarthquakes(payload: any): RuntimeEvent[] {
  return (payload?.features || []).slice(0, 100).flatMap((feature: any) => {
    const coordinates = feature.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
    const magnitude = Number(feature.properties?.mag || 0);
    return [{
      id: `usgs:${feature.id}`,
      sourceId: 'usgs-earthquake',
      category: 'earthquake',
      title: feature.properties?.title || feature.properties?.place || 'Deprem',
      summary: `M${magnitude.toFixed(1)} • Derinlik ${Number(coordinates[2] || 0).toFixed(1)} km`,
      severity: earthquakeSeverity(magnitude),
      lat: Number(coordinates[1]),
      lng: Number(coordinates[0]),
      observedAt: new Date(feature.properties?.time || Date.now()).toISOString(),
      url: feature.properties?.url || null,
      data: { magnitude, depthKm: Number(coordinates[2] || 0) },
    }];
  });
}

const EONET_SEVERITY: Record<string, Severity> = {
  Wildfires: 'high',
  Volcanoes: 'high',
  'Severe Storms': 'high',
  Floods: 'medium',
  Landslides: 'medium',
  Earthquakes: 'high',
};

function normalizeEonet(payload: any): RuntimeEvent[] {
  return (payload?.events || []).flatMap((event: any) => {
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

function normalizeGdacs(payload: any): RuntimeEvent[] {
  const severityMap: Record<string, Severity> = {
    Red: 'critical',
    Orange: 'high',
    Green: 'medium',
  };
  return (payload?.features || []).slice(0, 100).flatMap((feature: any) => {
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

const SOURCES: SourceDefinition[] = [
  {
    id: 'usgs-earthquake',
    name: 'USGS Earthquake Catalog',
    provider: 'USGS',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
    normalize: normalizeEarthquakes,
  },
  {
    id: 'nasa-eonet',
    name: 'NASA EONET',
    provider: 'NASA',
    url: 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100',
    normalize: normalizeEonet,
  },
  {
    id: 'gdacs-disasters',
    name: 'GDACS Global Disaster Alerts',
    provider: 'GDACS / European Commission',
    url: 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP',
    normalize: normalizeGdacs,
  },
];

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get('Origin');
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set(
    [requestOrigin, ...(env.APP_ORIGIN || '').split(',')]
      .map((item) => item.trim().replace(/\/$/, ''))
      .filter(Boolean)
  );
  return {
    'Access-Control-Allow-Origin': origin && allowed.has(origin) ? origin : requestOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-SyKasif-Admin',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function publish(env: Env, snapshot: unknown): Promise<void> {
  const id = env.LIVE_HUB.idFromName('global');
  const stub = env.LIVE_HUB.get(id);
  await stub.fetch('https://live-hub/publish', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
}
async function fetchSpaceWeatherEvents(): Promise<RuntimeEvent[]> {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
    if (!res.ok) return [];
    const data = (await res.json()) as string[][];
    if (data.length < 2) return [];

    const latest = data[data.length - 1];
    const kpVal = parseFloat(latest[1]) || 0;
    const timeTag = latest[0];

    return [{
      id: `noaa:geomagnetic-kp-${timeTag}`,
      sourceId: 'noaa-space-weather',
      category: 'space-weather',
      title: `Jeomanyetik Kp İndeksi: ${kpVal}`,
      summary: `Küresel Kp İndeksi: ${kpVal}. ${kpVal >= 5 ? 'Jeomanyetik fırtına seviyesinde (GPS/Radyo etkilenebilir).' : 'Sakin/Normal seviyede.'}`,
      severity: kpVal >= 5 ? 'high' : 'low',
      lat: 0,
      lng: 0,
      observedAt: new Date(timeTag).toISOString(),
      url: 'https://www.swpc.noaa.gov/',
      data: { kpIndex: kpVal },
    }];
  } catch {
    return [];
  }
}

async function fetchUsgsEvents(): Promise<RuntimeEvent[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', {
      headers: { Accept: 'application/json', 'User-Agent': 'SyKasif-Runtime/0.2' },
    });
    if (!res.ok) return [];
    return normalizeEarthquakes(await res.json());
  } catch {
    return [];
  }
}

async function fetchNasaEvents(): Promise<RuntimeEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100', {
      headers: { Accept: 'application/json', 'User-Agent': 'SyKasif-Runtime/0.2' },
    });
    if (!res.ok) return [];
    return normalizeEonet(await res.json());
  } catch {
    return [];
  }
}

async function fetchGdacsEvents(): Promise<RuntimeEvent[]> {
  try {
    const res = await fetch('https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP', {
      headers: { Accept: 'application/json', 'User-Agent': 'SyKasif-Runtime/0.2' },
    });
    if (!res.ok) return [];
    return normalizeGdacs(await res.json());
  } catch {
    return [];
  }
}

async function syncSources(env: Env): Promise<void> {
  const runId = crypto.randomUUID();
  const startedAt = now();
  await env.DB.prepare(
    'INSERT INTO sync_runs (id, started_at, status) VALUES (?, ?, ?)'
  )
    .bind(runId, startedAt, 'running')
    .run();

  let eventCount = 0;
  const errors: string[] = [];
  for (const source of SOURCES) {
    await env.DB.prepare(
      `INSERT INTO sources (id, name, provider, url, trusted, status)
       VALUES (?, ?, ?, ?, 1, 'syncing')
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, provider=excluded.provider,
       url=excluded.url, trusted=1, status='syncing', error=NULL`
    )
      .bind(source.id, source.name, source.provider, source.url)
      .run();

    try {
      const response = await fetch(source.url, {
        headers: { Accept: 'application/json', 'User-Agent': 'SyKasif-Runtime/0.2' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const events = source.normalize(await response.json());
      eventCount += events.length;

      const statements: RuntimePreparedStatement[] = [
        env.DB.prepare('DELETE FROM events WHERE source_id = ?').bind(source.id),
      ];
      for (const event of events) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO events
             (id, source_id, category, title, summary, severity, lat, lng,
              observed_at, url, data_json, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            event.id,
            event.sourceId,
            event.category,
            event.title,
            event.summary,
            event.severity,
            event.lat,
            event.lng,
            event.observedAt,
            event.url,
            JSON.stringify(event.data),
            now()
          )
        );
      }
      statements.push(
        env.DB.prepare(
          `UPDATE sources SET status='online', event_count=?, last_sync_at=?, error=NULL
           WHERE id=?`
        ).bind(events.length, now(), source.id)
      );
      await env.DB.batch(statements);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      errors.push(`${source.id}: ${message}`);
      await env.DB.prepare(
        `UPDATE sources SET status='error', last_sync_at=?, error=? WHERE id=?`
      )
        .bind(now(), message, source.id)
        .run();
    }
  }

  await env.DB.prepare(
    `UPDATE sync_runs SET completed_at=?, status=?, source_count=?, event_count=?, error=?
     WHERE id=?`
  )
    .bind(
      now(),
      errors.length === SOURCES.length ? 'error' : 'completed',
      SOURCES.length,
      eventCount,
      errors.length ? errors.join(' | ') : null,
      runId
    )
    .run();

  await publish(env, await buildSnapshot(env));
}

async function buildSnapshot(env: Env): Promise<Record<string, unknown>> {
  const sourceResult = await env.DB.prepare(
    `SELECT id, name, provider, trusted, status, event_count as eventCount,
     last_sync_at as lastSyncAt, error FROM sources ORDER BY name`
  ).all();
  const eventResult = await env.DB.prepare(
    `SELECT id, sourceId, category, title, summary, severity,
            lat, lng, observedAt, url, dataJson
     FROM (
       SELECT id, source_id as sourceId, category, title, summary, severity,
              lat, lng, observed_at as observedAt, url, data_json as dataJson,
              ROW_NUMBER() OVER (
                PARTITION BY source_id ORDER BY observed_at DESC
              ) as sourceRank
       FROM events
     )
     WHERE sourceRank <= 50
     ORDER BY observedAt DESC
     LIMIT 150`
  ).all();
  const approvalResult = await env.DB.prepare(
    `SELECT id, type, title, description, status, created_at as createdAt
     FROM approvals WHERE status='pending' ORDER BY created_at DESC`
  ).all();
  const run = await env.DB.prepare(
    `SELECT completed_at as completedAt FROM sync_runs
     WHERE status IN ('completed','error') ORDER BY started_at DESC LIMIT 1`
  ).first<{ completedAt: string | null }>();

  const sources = sourceResult.results as Array<Record<string, unknown>>;
  const eventRows = eventResult.results as unknown as Array<{
    id: string;
    sourceId: string;
    category: string;
    title: string;
    summary: string;
    severity: Severity;
    lat: number;
    lng: number;
    observedAt: string;
    url: string | null;
    dataJson: string;
  }>;
  const events = eventRows.map(({ dataJson, ...event }) => ({
    ...event,
    data: JSON.parse(dataJson || '{}') as Record<string, unknown>,
  }));
  const sourceAgents = sources.map((source) => ({
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
  const eventAgents = events.slice(0, 40).map((event) => ({
    id: `event-agent:${event.id}`,
    kind: 'event',
    name: `${String(event.category).replace(/-/g, ' ')} İzleme Ajanı`,
    status: 'active',
    sourceId: event.sourceId,
    eventId: event.id,
    category: event.category,
    lastUpdatedAt: event.observedAt,
    detail: event.title,
  }));
  const agents = [...sourceAgents, ...eventAgents];

  return {
    mode: 'live',
    generatedAt: now(),
    lastUpdatedAt: run?.completedAt || null,
    syncing: sources.some((source) => source.status === 'syncing'),
    agents,
    sources: sources.map((source) => ({ ...source, trusted: Boolean(source.trusted) })),
    events,
    approvals: approvalResult.results,
    metrics: {
      activeAgents: agents.filter((agent) => agent.status === 'active').length,
      syncingAgents: agents.filter((agent) => agent.status === 'syncing').length,
      errorAgents: agents.filter((agent) => agent.status === 'error').length,
      liveEvents: events.length,
      onlineSources: sources.filter((source) => source.status === 'online').length,
      pendingApprovals: approvalResult.results.length,
    },
  };
}

function isAdmin(request: Request, env: Env): boolean {
  return Boolean(
    env.ADMIN_TOKEN &&
      request.headers.get('X-SyKasif-Admin') === env.ADMIN_TOKEN
  );
}

async function handleRequest(
  request: Request,
  env: Env,
  ctx: { waitUntil(promise: Promise<unknown>): void }
): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/api/runtime/snapshot') {
    return json(request, env, await buildSnapshot(env));
  }
  if (request.method === 'GET' && url.pathname === '/api/runtime/stream') {
    const id = env.LIVE_HUB.idFromName('global');
    const hubResponse = await env.LIVE_HUB.get(id).fetch('https://live-hub/connect');
    const headers = new Headers(hubResponse.headers);
    for (const [key, value] of Object.entries(corsHeaders(request, env))) {
      headers.set(key, String(value));
    }
    return new Response(hubResponse.body, {
      status: hubResponse.status,
      headers,
    });
  }
  if ((request.method === 'POST' || request.method === 'GET') && url.pathname === '/api/runtime/sync') {
    const latest = await env.DB.prepare(
      'SELECT started_at as startedAt FROM sync_runs ORDER BY started_at DESC LIMIT 1'
    ).first<{ startedAt: string }>();
    if (!latest || Date.now() - Date.parse(latest.startedAt) > 60_000) {
      ctx.waitUntil(syncSources(env));
    }
    return json(request, env, await buildSnapshot(env), 202);
  }

  const approvalMatch = url.pathname.match(
    /^\/api\/runtime\/approvals\/([^/]+)\/(approved|rejected)$/
  );
  if (request.method === 'POST' && approvalMatch) {
    if (!isAdmin(request, env)) {
      return json(request, env, { error: 'Yönetici yetkisi gerekli.' }, 401);
    }
    const result = await env.DB.prepare(
      `UPDATE approvals SET status=?, decided_at=? WHERE id=? AND status='pending'`
    )
      .bind(approvalMatch[2], now(), decodeURIComponent(approvalMatch[1]))
      .run();
    if (!result.meta.changes) {
      return json(request, env, { error: 'Onay kaydı bulunamadı.' }, 404);
    }
    const snapshot = await buildSnapshot(env);
    ctx.waitUntil(publish(env, snapshot));
    return json(request, env, { ok: true });
  }

  if (request.method === 'POST' && url.pathname === '/api/runtime/source-proposals') {
    if (!isAdmin(request, env)) {
      return json(request, env, { error: 'Yönetici yetkisi gerekli.' }, 401);
    }
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      url?: string;
    };
    if (!body.title || !body.url?.startsWith('https://')) {
      return json(request, env, { error: 'Başlık ve HTTPS URL zorunludur.' }, 400);
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO approvals
       (id, type, title, description, payload_json, status, created_at)
       VALUES (?, 'source', ?, ?, ?, 'pending', ?)`
    )
      .bind(id, body.title, body.description || '', JSON.stringify(body), now())
      .run();
    return json(request, env, { id, status: 'pending' }, 201);
  }

  return json(request, env, { error: 'Uç nokta bulunamadı.' }, 404);
}

export class LiveHub {
  private readonly clients = new Set<WritableStreamDefaultWriter<Uint8Array>>();
  private readonly encoder = new TextEncoder();

  constructor(
    private readonly state: unknown,
    private readonly env: Env
  ) {
    void this.state;
    void this.env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/connect') {
      const stream = new TransformStream<Uint8Array, Uint8Array>();
      const writer = stream.writable.getWriter();
      this.clients.add(writer);
      await writer.write(
        this.encoder.encode(`event: connected\ndata: ${JSON.stringify({ at: now() })}\n\n`)
      );
      request.signal.addEventListener('abort', () => {
        this.clients.delete(writer);
        void writer.close().catch(() => undefined);
      });
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }
    if (url.pathname === '/publish' && request.method === 'POST') {
      const snapshot = await request.text();
      const message = this.encoder.encode(`event: snapshot\ndata: ${snapshot}\n\n`);
      const fetched = await Promise.allSettled([
  fetchGdacsEvents(),
  fetchNasaEvents(),
  fetchUsgsEvents(),
  fetchSpaceWeatherEvents(),
]);
      await Promise.allSettled(
        [...this.clients].map(async (writer) => {
          try {
            await writer.write(message);
          } catch {
            this.clients.delete(writer);
          }
        })
      );
      return new Response(null, { status: 204 });
    }
    return new Response('Not found', { status: 404 });
  }
}

export default {
  fetch: handleRequest,
  async scheduled(
    _controller: unknown,
    env: Env,
    ctx: { waitUntil(promise: Promise<unknown>): void }
  ): Promise<void> {
    ctx.waitUntil(syncSources(env));
  },
};
