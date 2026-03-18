import { z } from 'zod';
import { getPage } from '../scraper/browser-manager.js';
import { ensureAuthenticated } from '../scraper/auth.js';
import { scrapeOverview } from '../scraper/pages/overview.js';
import { insertAccountSnapshot, getLatestAccountSnapshot, getAccountSnapshots } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { checkScrapeThrottle, updateScrapeTime } from './throttle.js';

export const schema = z.object({
  period: z.enum(['7d', '28d', '60d']).default('7d'),
  refresh: z.boolean().default(false),
});

export type Input = z.infer<typeof schema>;

export const definition = {
  name: 'get-account-overview',
  description: 'Get TikTok account overview metrics including video views, profile views, followers, and engagement. Returns current metrics plus trend data compared to previous snapshot.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      period: { type: 'string', enum: ['7d', '28d', '60d'], default: '7d', description: 'Time period for metrics' },
      refresh: { type: 'boolean', default: false, description: 'Force a fresh scrape instead of using cached data' },
    },
  },
};

export async function execute(input: Input) {
  const { period, refresh } = input;

  // Check if we have recent data
  const existing = getLatestAccountSnapshot(period);
  if (existing && !refresh) {
    const age = Date.now() - new Date(existing.scraped_at).getTime();
    if (age < 3600000) { // Less than 1 hour old
      logger.info('Returning cached account overview');
      const trend = calculateTrend(period);
      return { current: existing, trend, cached: true };
    }
  }

  // Throttle check
  checkScrapeThrottle();

  // Scrape fresh data
  const page = await getPage();
  await ensureAuthenticated(page);
  const data = await scrapeOverview(page, period);
  updateScrapeTime();

  // Store in DB
  insertAccountSnapshot({
    period: data.period,
    video_views: data.videoViews,
    profile_views: data.profileViews,
    likes: data.likes,
    comments: data.comments,
    shares: data.shares,
    followers: data.followers,
    follower_growth: data.followerGrowth,
  });

  const trend = calculateTrend(period);

  return {
    current: {
      period: data.period,
      videoViews: data.videoViews,
      profileViews: data.profileViews,
      likes: data.likes,
      comments: data.comments,
      shares: data.shares,
      followers: data.followers,
      followerGrowth: data.followerGrowth,
    },
    trend,
    cached: false,
  };
}

function calculateTrend(period: string) {
  const snapshots = getAccountSnapshots(period, 30);
  if (snapshots.length < 2) return null;

  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots[snapshots.length - 2];

  function pctChange(curr: number | null, prev: number | null): string | null {
    if (curr === null || prev === null || prev === 0) return null;
    const change = ((curr - prev) / prev) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }

  return {
    videoViews: pctChange(latest.video_views, previous.video_views),
    profileViews: pctChange(latest.profile_views, previous.profile_views),
    likes: pctChange(latest.likes, previous.likes),
    comments: pctChange(latest.comments, previous.comments),
    shares: pctChange(latest.shares, previous.shares),
    followers: pctChange(latest.followers, previous.followers),
    snapshotCount: snapshots.length,
    periodDays: 30,
  };
}
