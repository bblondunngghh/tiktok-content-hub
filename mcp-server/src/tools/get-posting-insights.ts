import { z } from 'zod';
import { getPage } from '../scraper/browser-manager.js';
import { ensureAuthenticated } from '../scraper/auth.js';
import { scrapeFollowers } from '../scraper/pages/followers.js';
import { insertFollowerDemographics, getLatestFollowerDemographics, getTopPerformingVideos } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { checkScrapeThrottle, updateScrapeTime } from './throttle.js';

export const schema = z.object({
  refresh: z.boolean().default(false),
});

export type Input = z.infer<typeof schema>;

export const definition = {
  name: 'get-posting-insights',
  description: 'Get insights on best posting times based on follower activity, audience demographics, and content performance patterns. Combines follower data with historical video performance to recommend optimal posting strategy.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      refresh: { type: 'boolean', default: false, description: 'Force a fresh scrape of follower data' },
    },
  },
};

export async function execute(input: Input) {
  const { refresh } = input;

  // Get or fetch follower demographics
  let demographics = getLatestFollowerDemographics();

  if (!demographics || refresh) {
    checkScrapeThrottle();
    const page = await getPage();
    await ensureAuthenticated(page);
    const data = await scrapeFollowers(page);
    updateScrapeTime();

    insertFollowerDemographics({
      gender_split: data.genderSplit,
      age_distribution: data.ageDistribution,
      top_countries: data.topCountries,
      active_hours: data.activeHours,
    });

    demographics = {
      scraped_at: new Date().toISOString(),
      gender_split: data.genderSplit,
      age_distribution: data.ageDistribution,
      top_countries: data.topCountries,
      active_hours: data.activeHours,
    };
  }

  // Get top performing content for pattern analysis
  const topByViews = getTopPerformingVideos('views', 10, 60);
  const topByEngagement = getTopPerformingVideos('likes', 10, 60);

  // Analyze best posting times from active hours
  const bestPostingTimes = analyzeBestTimes(demographics.active_hours);

  // Analyze content patterns
  const contentPatterns = analyzeContentPatterns(topByViews, topByEngagement);

  return {
    audience: {
      genderSplit: demographics.gender_split,
      ageDistribution: demographics.age_distribution,
      topCountries: demographics.top_countries,
    },
    bestPostingTimes,
    contentPatterns,
    recommendations: generateRecommendations(bestPostingTimes, demographics, contentPatterns),
    dataFreshness: demographics.scraped_at,
  };
}

function analyzeBestTimes(activeHours: Record<string, number[]>): { day: string; hour: number; activity: number }[] {
  const slots: { day: string; hour: number; activity: number }[] = [];

  for (const [day, hours] of Object.entries(activeHours)) {
    if (!Array.isArray(hours)) continue;
    hours.forEach((activity, hour) => {
      slots.push({ day, hour, activity });
    });
  }

  // Sort by activity level descending, return top 10 slots
  return slots
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 10);
}

function analyzeContentPatterns(
  topByViews: { description: string | null; views: number | null; likes: number | null; avg_watch_time_seconds: number | null }[],
  topByEngagement: { description: string | null; likes: number | null; comments: number | null; shares: number | null; views: number | null }[]
) {
  const avgViews = topByViews.reduce((sum, v) => sum + (v.views || 0), 0) / (topByViews.length || 1);
  const avgWatchTime = topByViews.reduce((sum, v) => sum + (v.avg_watch_time_seconds || 0), 0) / (topByViews.length || 1);
  const avgEngagementRate = topByEngagement.reduce((sum, v) => {
    const views = v.views || 0;
    if (views === 0) return sum;
    return sum + ((v.likes || 0) + (v.comments || 0) + (v.shares || 0)) / views * 100;
  }, 0) / (topByEngagement.length || 1);

  return {
    avgViewsTopContent: Math.round(avgViews),
    avgWatchTimeTopContent: Math.round(avgWatchTime),
    avgEngagementRateTopContent: `${avgEngagementRate.toFixed(2)}%`,
    topVideoCount: topByViews.length,
    topVideoDescriptions: topByViews
      .filter(v => v.description)
      .map(v => v.description)
      .slice(0, 5),
  };
}

function generateRecommendations(
  bestTimes: { day: string; hour: number; activity: number }[],
  demographics: { gender_split: Record<string, number>; age_distribution: Record<string, number> },
  patterns: { avgViewsTopContent: number; avgWatchTimeTopContent: number }
) {
  const recommendations: string[] = [];

  // Posting time recommendations
  if (bestTimes.length > 0) {
    const topSlot = bestTimes[0];
    recommendations.push(
      `Best posting time: ${topSlot.day} at ${topSlot.hour}:00 (highest follower activity)`
    );

    // Find best time per day
    const bestPerDay = new Map<string, { hour: number; activity: number }>();
    for (const slot of bestTimes) {
      const existing = bestPerDay.get(slot.day);
      if (!existing || slot.activity > existing.activity) {
        bestPerDay.set(slot.day, slot);
      }
    }
    for (const [day, slot] of bestPerDay) {
      recommendations.push(`${day}: post around ${slot.hour}:00`);
    }
  }

  // Audience recommendations
  const dominantGender = Object.entries(demographics.gender_split)
    .sort(([, a], [, b]) => b - a)[0];
  if (dominantGender) {
    recommendations.push(`Primary audience: ${dominantGender[0]} (${dominantGender[1]}%)`);
  }

  const dominantAge = Object.entries(demographics.age_distribution)
    .sort(([, a], [, b]) => b - a)[0];
  if (dominantAge) {
    recommendations.push(`Primary age group: ${dominantAge[0]} (${dominantAge[1]}%)`);
  }

  // Content recommendations
  if (patterns.avgWatchTimeTopContent > 0) {
    recommendations.push(
      `Top content averages ${patterns.avgWatchTimeTopContent}s watch time — aim for this duration`
    );
  }

  return recommendations;
}
