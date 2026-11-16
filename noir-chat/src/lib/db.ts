import 'server-only';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export function dataDir(): string {
  const dir = path.resolve(process.env.NOIR_DATA_DIR || path.join(process.cwd(), 'data'));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Ordered, append-only migrations. Never edit a shipped migration; add a new one.
const MIGRATIONS: string[] = [
  // 1: initial schema
  `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE auth (
    id            INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL,
    user_agent TEXT
  );
  CREATE TABLE login_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    ip TEXT
  );
  CREATE TABLE characters (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    age              INTEGER NOT NULL,
    gender           TEXT NOT NULL DEFAULT '',
    tagline          TEXT NOT NULL DEFAULT '',
    appearance       TEXT NOT NULL DEFAULT '',
    personality      TEXT NOT NULL DEFAULT '',
    speech_style     TEXT NOT NULL DEFAULT '',
    background       TEXT NOT NULL DEFAULT '',
    world            TEXT NOT NULL DEFAULT '',
    relationship     TEXT NOT NULL DEFAULT '',
    greeting         TEXT NOT NULL DEFAULT '',
    example_dialogue TEXT NOT NULL DEFAULT '',
    system_extra     TEXT NOT NULL DEFAULT '',
    tags             TEXT NOT NULL DEFAULT '',
    avatar           TEXT,
    model            TEXT,
    temperature      REAL,
    adult_enabled    INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );
  CREATE TABLE conversations (
    id            TEXT PRIMARY KEY,
    character_id  TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    title         TEXT NOT NULL DEFAULT '',
    model         TEXT,
    summary       TEXT NOT NULL DEFAULT '',
    summary_upto  INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX idx_conv_char ON conversations(character_id, updated_at DESC);
  CREATE TABLE messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('complete','partial','error')),
    model           TEXT,
    eval_count      INTEGER,
    created_at      INTEGER NOT NULL
  );
  CREATE INDEX idx_msg_conv ON messages(conversation_id, id);
  `,
];

function migrate(db: Database.Database) {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

const globalForDb = globalThis as unknown as { __noirDb?: Database.Database };

export function db(): Database.Database {
  if (!globalForDb.__noirDb) {
    const file = path.join(dataDir(), 'noir.db');
    const conn = new Database(file);
    conn.pragma('journal_mode = WAL');
    conn.pragma('foreign_keys = ON');
    conn.pragma('busy_timeout = 5000');
    migrate(conn);
    globalForDb.__noirDb = conn;
  }
  return globalForDb.__noirDb;
}

export function now(): number {
  return Date.now();
}
