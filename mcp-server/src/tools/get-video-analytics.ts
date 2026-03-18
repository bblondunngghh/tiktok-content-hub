import { z } from 'zod';
import { getPage } from '../scraper/browser-manager.js';
import { ensureAuthenticated } from '../scraper/auth.js';
import { scrapeContent } from '../scraper/pages/content.js';
import { insertVideoAnalytics, getLatestVideoAnalytics } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { checkScrapeThrottle, updateScrapeTime } from './throttle.js';

export const schema = z.object({
  count: z.number().min(1).max(50).default(10),
  refresh: z.boolean().default(false),
});

export type Input = z.infer<typeof schema>;

export const definition = {
  name: 'get-video-analytics',
  description: 'Get analytics for recent TikTok videos including views, likes, comments, shares, and average watch time. Returns per-video metrics with engagement rates.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      count: { type: 'number', default: 10, description: 'Number of videos to return (1-50)' },
      refresh: { type: 'boolean', default: false, description: 'Force a fresh scrape instead of using cached data' },
    },
  },
};

export async function execute(input: Input) {
  const { count, refresh } = input;

  // Check for cached data
  if (!refresh) {
    const cached = getLatestVideoAnalytics(count);
    if (cached.length > 0) {
      const age = Date.now() - new Date(cached[0].scraped_at).getTime();
      if (age < 3600000) { // Less than 1 hour old
        logger.info('Returning cached video analytics');
        return {
          videos: cached.map(v => ({
            ...v,
            engagementRate: v.views && v.views > 0
              ? (((v.likes || 0) + (v.comments || 0) + (v.shares || 0)) / v.views * 100).toFixed(2) + '%'
              : 'N/A',
          })),
          cached: true,
          count: cached.length,
        };
      }
    }
  }

  // Throttle check
  checkScrapeThrottle();

  // Scrape fresh data
  const page = await getPage();
  await ensureAuthenticated(page);
  const videos = await scrapeContent(page, count);
  updateScrapeTime();

  // Store in DB
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

  return {
    videos: videos.map(v => ({
      ...v,
      engagementRate: v.views && v.views > 0
        ? (((v.likes || 0) + (v.comments || 0) + (v.shares || 0)) / v.views * 100).toFixed(2) + '%'
        : 'N/A',
    })),
    cached: false,
    count: videos.length,
  };
}
