PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  player_id INTEGER PRIMARY KEY AUTOINCREMENT,
  puuid TEXT NOT NULL UNIQUE,
  riot_id TEXT,
  tag TEXT,
  region TEXT NOT NULL DEFAULT 'KR',
  first_seen INTEGER NOT NULL,
  last_updated INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  game_datetime INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  patch TEXT,
  queue_id INTEGER NOT NULL,
  queue_type TEXT NOT NULL,
  source TEXT NOT NULL,
  raw_json TEXT,
  inserted_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_time ON matches(game_datetime);
CREATE INDEX IF NOT EXISTS idx_matches_queue_time ON matches(queue_id, game_datetime);

CREATE TABLE IF NOT EXISTS match_players (
  match_id TEXT NOT NULL,
  player_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  champion_id INTEGER,
  champion_name TEXT,
  win INTEGER NOT NULL,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  damage INTEGER,
  damage_taken INTEGER,
  healing INTEGER,
  shielding INTEGER,
  gold INTEGER,
  party_id TEXT,
  party_source TEXT,
  raw_json TEXT,
  PRIMARY KEY(match_id, player_id),
  FOREIGN KEY(match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
  FOREIGN KEY(player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_match_players_player ON match_players(player_id, match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match_team ON match_players(match_id, team_id);

CREATE TABLE IF NOT EXISTS crawl_frontier (
  puuid TEXT PRIMARY KEY,
  depth INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  discovered_from_match TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crawl_frontier_status ON crawl_frontier(status, next_attempt_at, depth);

CREATE TABLE IF NOT EXISTS crawl_checkpoint (
  checkpoint_id INTEGER PRIMARY KEY CHECK(checkpoint_id = 1),
  calls_used INTEGER NOT NULL DEFAULT 0,
  matches_saved INTEGER NOT NULL DEFAULT 0,
  players_seen INTEGER NOT NULL DEFAULT 0,
  max_depth_seen INTEGER NOT NULL DEFAULT 0,
  cooldown_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS rating_runs (
  run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  config_json TEXT NOT NULL,
  train_end_time INTEGER NOT NULL,
  test_start_time INTEGER NOT NULL,
  test_end_time INTEGER NOT NULL,
  train_matches INTEGER NOT NULL,
  test_matches INTEGER NOT NULL,
  data_fingerprint TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rating_player_states (
  run_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  rating REAL NOT NULL,
  uncertainty REAL NOT NULL,
  games INTEGER NOT NULL,
  extra_json TEXT,
  PRIMARY KEY(run_id, player_id),
  FOREIGN KEY(run_id) REFERENCES rating_runs(run_id) ON DELETE CASCADE,
  FOREIGN KEY(player_id) REFERENCES players(player_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rating_predictions (
  run_id INTEGER NOT NULL,
  match_id TEXT NOT NULL,
  predicted_at_time INTEGER NOT NULL,
  team_a_id INTEGER NOT NULL,
  team_b_id INTEGER NOT NULL,
  team_a_rating REAL NOT NULL,
  team_b_rating REAL NOT NULL,
  team_a_win_prob REAL NOT NULL,
  actual_team_a_win INTEGER NOT NULL,
  mode TEXT NOT NULL,
  PRIMARY KEY(run_id, match_id, mode),
  FOREIGN KEY(run_id) REFERENCES rating_runs(run_id) ON DELETE CASCADE,
  FOREIGN KEY(match_id) REFERENCES matches(match_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rating_metrics (
  run_id INTEGER NOT NULL,
  mode TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL,
  payload_json TEXT,
  PRIMARY KEY(run_id, mode, metric_name),
  FOREIGN KEY(run_id) REFERENCES rating_runs(run_id) ON DELETE CASCADE
);
