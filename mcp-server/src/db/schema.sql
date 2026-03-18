CREATE TABLE IF NOT EXISTS account_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  period TEXT NOT NULL,
  video_views INTEGER,
  profile_views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  followers INTEGER,
  follower_growth INTEGER
);

CREATE TABLE IF NOT EXISTS video_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  video_id TEXT NOT NULL,
  description TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  avg_watch_time_seconds REAL,
  posted_at TEXT
);

CREATE TABLE IF NOT EXISTS follower_demographics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
  gender_split_json TEXT,
  age_distribution_json TEXT,
  top_countries_json TEXT,
  active_hours_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_snapshots_date ON account_snapshots(scraped_at);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video ON video_analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_date ON video_analytics(scraped_at);
CREATE INDEX IF NOT EXISTS idx_follower_demographics_date ON follower_demographics(scraped_at);
