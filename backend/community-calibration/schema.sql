-- Community Calibration v1 — Cloudflare D1 reference schema
-- Indexed columns support calibration queries; payload_json preserves a versioned,
-- sanitized gameplay envelope so future metrics can be recomputed without forcing
-- a destructive relational migration every time the client learns a new field.

CREATE TABLE IF NOT EXISTS calibration_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  schema_version INTEGER NOT NULL,
  policy_version INTEGER NOT NULL,
  anonymous_install_id TEXT NOT NULL,
  game_hash TEXT NOT NULL,
  queue_id INTEGER,
  patch_version TEXT,
  app_version TEXT,
  engine_version TEXT,
  champion_id INTEGER,
  role TEXT,
  role_score REAL,
  role_grade TEXT,
  riot_grade TEXT,
  payload_json TEXT NOT NULL,
  UNIQUE(anonymous_install_id, game_hash, schema_version)
);

CREATE INDEX IF NOT EXISTS idx_calibration_champion
  ON calibration_events(champion_id, queue_id, patch_version);
CREATE INDEX IF NOT EXISTS idx_calibration_role
  ON calibration_events(role, queue_id, patch_version);
CREATE INDEX IF NOT EXISTS idx_calibration_grade
  ON calibration_events(champion_id, role_grade, riot_grade);
CREATE INDEX IF NOT EXISTS idx_calibration_engine
  ON calibration_events(engine_version, app_version);
CREATE INDEX IF NOT EXISTS idx_calibration_received
  ON calibration_events(received_at);

-- Optional anonymous device registration. This is not a Riot/account identifier.
CREATE TABLE IF NOT EXISTS calibration_devices (
  anonymous_install_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  policy_version INTEGER NOT NULL,
  app_version TEXT
);
