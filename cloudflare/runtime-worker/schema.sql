CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  trusted INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting',
  event_count INTEGER NOT NULL DEFAULT 0,
  last_sync_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  observed_at TEXT NOT NULL,
  url TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES sources(id)
);

CREATE INDEX IF NOT EXISTS idx_events_observed_at
ON events(observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_source
ON events(source_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  decided_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_approvals_status
ON approvals(status, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
