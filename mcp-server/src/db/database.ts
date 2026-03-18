import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: Database.Database;

export interface AccountSnapshot {
  period: string;
  video_views: number | null;
  profile_views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followers: number | null;
  follower_growth: number | null;
}

export interface VideoAnalytics {
  video_id: string;
  description: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  avg_watch_time_seconds: number | null;
  posted_at: string | null;
}

export interface FollowerDemographics {
  gender_split: Record<string, number>;
  age_distribution: Record<string, number>;
  top_countries: Record<string, number>;
  active_hours: Record<string, number[]>;
}

export function initDatabase(): void {
  mkdirSync(config.dataDir, { recursive: true });
  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');

  const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  logger.info('Database initialized at', config.dbPath);
}

export function insertAccountSnapshot(snapshot: AccountSnapshot): void {
  const stmt = db.prepare(`
    INSERT INTO account_snapshots (period, video_views, profile_views, likes, comments, shares, followers, follower_growth)
    VALUES (@period, @video_views, @profile_views, @likes, @comments, @shares, @followers, @follower_growth)
  `);
  stmt.run(snapshot);
}

export function getLatestAccountSnapshot(period: string): (AccountSnapshot & { scraped_at: string }) | undefined {
  const stmt = db.prepare(`
    SELECT * FROM account_snapshots WHERE period = ? ORDER BY scraped_at DESC LIMIT 1
  `);
  return stmt.get(period) as (AccountSnapshot & { scraped_at: string }) | undefined;
}

export function getAccountSnapshots(period: string, days: number = 30): (AccountSnapshot & { scraped_at: string })[] {
  const stmt = db.prepare(`
    SELECT * FROM account_snapshots
    WHERE period = ? AND scraped_at >= datetime('now', ?)
    ORDER BY scraped_at ASC
  `);
  return stmt.all(period, `-${days} days`) as (AccountSnapshot & { scraped_at: string })[];
}

export function insertVideoAnalytics(videos: VideoAnalytics[]): void {
  const stmt = db.prepare(`
    INSERT INTO video_analytics (video_id, description, views, likes, comments, shares, avg_watch_time_seconds, posted_at)
    VALUES (@video_id, @description, @views, @likes, @comments, @shares, @avg_watch_time_seconds, @posted_at)
  `);
  const insertMany = db.transaction((items: VideoAnalytics[]) => {
    for (const item of items) {
      stmt.run(item);
    }
  });
  insertMany(videos);
}

export function getLatestVideoAnalytics(count: number = 10): (VideoAnalytics & { scraped_at: string })[] {
  const stmt = db.prepare(`
    SELECT va.* FROM video_analytics va
    INNER JOIN (
      SELECT video_id, MAX(scraped_at) as max_scraped
      FROM video_analytics
      GROUP BY video_id
    ) latest ON va.video_id = latest.video_id AND va.scraped_at = latest.max_scraped
    ORDER BY va.views DESC
    LIMIT ?
  `);
  return stmt.all(count) as (VideoAnalytics & { scraped_at: string })[];
}

export function getTopPerformingVideos(
  metric: 'views' | 'likes' | 'comments' | 'shares' | 'avg_watch_time_seconds',
  count: number = 5,
  days: number = 30
): (VideoAnalytics & { scraped_at: string; engagement_rate: number })[] {
  const stmt = db.prepare(`
    SELECT va.*,
      CASE WHEN va.views > 0
        THEN ROUND((COALESCE(va.likes, 0) + COALESCE(va.comments, 0) + COALESCE(va.shares, 0)) * 100.0 / va.views, 2)
        ELSE 0
      END as engagement_rate
    FROM video_analytics va
    INNER JOIN (
      SELECT video_id, MAX(scraped_at) as max_scraped
      FROM video_analytics
      WHERE scraped_at >= datetime('now', ?)
      GROUP BY video_id
    ) latest ON va.video_id = latest.video_id AND va.scraped_at = latest.max_scraped
    ORDER BY ${metric === 'avg_watch_time_seconds' ? 'va.avg_watch_time_seconds' : metric === 'views' ? 'va.views' : metric === 'likes' ? 'va.likes' : metric === 'comments' ? 'va.comments' : 'va.shares'} DESC
    LIMIT ?
  `);
  return stmt.all(`-${days} days`, count) as (VideoAnalytics & { scraped_at: string; engagement_rate: number })[];
}

export function getVideoTrend(videoId: string): (VideoAnalytics & { scraped_at: string })[] {
  const stmt = db.prepare(`
    SELECT * FROM video_analytics WHERE video_id = ? ORDER BY scraped_at ASC
  `);
  return stmt.all(videoId) as (VideoAnalytics & { scraped_at: string })[];
}

export function insertFollowerDemographics(demographics: FollowerDemographics): void {
  const stmt = db.prepare(`
    INSERT INTO follower_demographics (gender_split_json, age_distribution_json, top_countries_json, active_hours_json)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(
    JSON.stringify(demographics.gender_split),
    JSON.stringify(demographics.age_distribution),
    JSON.stringify(demographics.top_countries),
    JSON.stringify(demographics.active_hours),
  );
}

export function getLatestFollowerDemographics(): (FollowerDemographics & { scraped_at: string }) | undefined {
  const stmt = db.prepare(`
    SELECT * FROM follower_demographics ORDER BY scraped_at DESC LIMIT 1
  `);
  const row = stmt.get() as { scraped_at: string; gender_split_json: string; age_distribution_json: string; top_countries_json: string; active_hours_json: string } | undefined;
  if (!row) return undefined;
  return {
    scraped_at: row.scraped_at,
    gender_split: JSON.parse(row.gender_split_json),
    age_distribution: JSON.parse(row.age_distribution_json),
    top_countries: JSON.parse(row.top_countries_json),
    active_hours: JSON.parse(row.active_hours_json),
  };
}

export function getLastScrapeTime(): string | undefined {
  const stmt = db.prepare(`
    SELECT MAX(scraped_at) as last_scrape FROM (
      SELECT scraped_at FROM account_snapshots
      UNION ALL
      SELECT scraped_at FROM video_analytics
      UNION ALL
      SELECT scraped_at FROM follower_demographics
    )
  `);
  const row = stmt.get() as { last_scrape: string | null } | undefined;
  return row?.last_scrape ?? undefined;
}
