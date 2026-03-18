import { z } from 'zod';
import { getTopPerformingVideos, getLatestVideoAnalytics } from '../db/database.js';
import { getPage } from '../scraper/browser-manager.js';
import { ensureAuthenticated } from '../scraper/auth.js';
import { scrapeContent } from '../scraper/pages/content.js';
import { insertVideoAnalytics } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { checkScrapeThrottle, updateScrapeTime } from './throttle.js';

export const schema = z.object({
  metric: z.enum(['views', 'likes', 'comments', 'shares', 'engagement_rate']).default('views'),
  count: z.number().min(1).max(20).default(5),
  days: z.number().min(1).max(365).default(30),
});

export type Input = z.infer<typeof schema>;

export const definition = {
  name: 'get-top-performing-content',
  description: 'Get top performing TikTok videos ranked by a chosen metric (views, likes, comments, shares, or engagement rate). Uses historical data from the database. If no data exists, triggers a fresh scrape.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      metric: { type: 'string', enum: ['views', 'likes', 'comments', 'shares', 'engagement_rate'], default: 'views', description: 'Metric to rank videos by' },
      count: { type: 'number', default: 5, description: 'Number of top videos to return (1-20)' },
      days: { type: 'number', default: 30, description: 'Look back period in days (1-365)' },
    },
  },
};

export async function execute(input: Input) {
  const { metric, count, days } = input;

  // Check if we have any data
  const existing = getLatestVideoAnalytics(1);
  if (existing.length === 0) {
    // No data in DB yet — need to scrape first
    logger.info('No video data in database, scraping first...');
    checkScrapeThrottle();

    const page = await getPage();
    await ensureAuthenticated(page);
    const videos = await scrapeContent(page, 20);
    updateScrapeTime();

    if (videos.length > 0) {
      insertVideoAnalytics(videos.map(v => ({
        video_id: v.videoId,
        description: v.description,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        avg_watch_time_seconds: v.avgWatchTimeSeconds,
        posted_at: v.postedAt,
      })));
    }
  }

  // Map engagement_rate to the DB column
  const dbMetric = metric === 'engagement_rate' ? 'views' : metric;
  const results = getTopPerformingVideos(
    dbMetric === 'views' ? 'views' : dbMetric as 'likes' | 'comments' | 'shares',
    count,
    days
  );

  // If sorting by engagement rate, re-sort
  let ranked = results;
  if (metric === 'engagement_rate') {
    ranked = [...results].sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0)).slice(0, count);
  }

  return {
    metric,
    period: `${days} days`,
    videos: ranked.map((v, i) => ({
      rank: i + 1,
      videoId: v.video_id,
      description: v.description,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      avgWatchTimeSeconds: v.avg_watch_time_seconds,
      engagementRate: `${v.engagement_rate}%`,
      postedAt: v.posted_at,
    })),
    totalTracked: results.length,
  };
}
