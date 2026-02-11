CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  burned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pastes_cleanup
  ON pastes(burned, created_at);

CREATE TABLE IF NOT EXISTS stats (
  key TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

