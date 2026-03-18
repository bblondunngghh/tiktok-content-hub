import type { Page } from 'playwright';
import { SELECTORS } from '../selectors.js';
import { logger } from '../../utils/logger.js';

export interface OverviewData {
  period: string;
  videoViews: number | null;
  profileViews: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  followers: number | null;
  followerGrowth: number | null;
}

const OVERVIEW_URL = 'https://www.tiktok.com/creator-center/analytics?tab=overview';

export async function scrapeOverview(page: Page, period: '7d' | '28d' | '60d' = '7d'): Promise<OverviewData> {
  logger.info(`Scraping overview for period: ${period}`);

  await page.goto(OVERVIEW_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Select the correct period tab
  const periodSelector = period === '7d'
    ? SELECTORS.overview.periodTab7d
    : period === '28d'
      ? SELECTORS.overview.periodTab28d
      : SELECTORS.overview.periodTab60d;

  try {
    const tabSelectors = periodSelector.split(', ');
    for (const sel of tabSelectors) {
      try {
        const tab = await page.waitForSelector(sel, { timeout: 3000 });
        if (tab) {
          await tab.click();
          await page.waitForTimeout(2000);
          break;
        }
      } catch {
        continue;
      }
    }
  } catch {
    logger.warn(`Could not select period tab for ${period}, using default`);
  }

  // Try structured selectors first, fall back to generic metric cards
  const data = await extractMetricsStructured(page) || await extractMetricsGeneric(page);

  return {
    period,
    ...data,
  };
}

async function extractMetricsStructured(page: Page): Promise<Omit<OverviewData, 'period'> | null> {
  try {
    const metrics = await page.evaluate((selectors) => {
      function getMetricValue(selectorStr: string): number | null {
        const sels = selectorStr.split(', ');
        for (const sel of sels) {
          const el = document.querySelector(sel);
          if (el?.textContent) {
            const num = el.textContent.replace(/[^0-9.-]/g, '');
            return num ? parseInt(num, 10) : null;
          }
        }
        return null;
      }

      return {
        videoViews: getMetricValue(selectors.videoViews),
        profileViews: getMetricValue(selectors.profileViews),
        likes: getMetricValue(selectors.likes),
        comments: getMetricValue(selectors.comments),
        shares: getMetricValue(selectors.shares),
        followers: getMetricValue(selectors.followers),
        followerGrowth: getMetricValue(selectors.followerGrowth),
      };
    }, SELECTORS.overview);

    // Check if we got at least some data
    const hasData = Object.values(metrics).some(v => v !== null);
    return hasData ? metrics : null;
  } catch {
    return null;
  }
}

async function extractMetricsGeneric(page: Page): Promise<Omit<OverviewData, 'period'>> {
  logger.info('Falling back to generic metric card extraction');

  const metrics = await page.evaluate((selectors) => {
    const result: Record<string, number | null> = {
      videoViews: null,
      profileViews: null,
      likes: null,
      comments: null,
      shares: null,
      followers: null,
      followerGrowth: null,
    };

    const cardSelectors = selectors.metricCards.split(', ');
    let cards: Element[] = [];
    for (const sel of cardSelectors) {
      cards = Array.from(document.querySelectorAll(sel));
      if (cards.length > 0) break;
    }

    const labelSelectors = selectors.metricLabel.split(', ');
    const valueSelectors = selectors.metricValue.split(', ');

    for (const card of cards) {
      let label = '';
      for (const sel of labelSelectors) {
        const labelEl = card.querySelector(sel);
        if (labelEl?.textContent) {
          label = labelEl.textContent.toLowerCase().trim();
          break;
        }
      }

      let value: number | null = null;
      for (const sel of valueSelectors) {
        const valueEl = card.querySelector(sel);
        if (valueEl?.textContent) {
          const num = valueEl.textContent.replace(/[^0-9.-]/g, '');
          value = num ? parseInt(num, 10) : null;
          break;
        }
      }

      if (label.includes('video view')) result.videoViews = value;
      else if (label.includes('profile view')) result.profileViews = value;
      else if (label.includes('like')) result.likes = value;
      else if (label.includes('comment')) result.comments = value;
      else if (label.includes('share')) result.shares = value;
      else if (label.includes('follower') && label.includes('growth')) result.followerGrowth = value;
      else if (label.includes('follower')) result.followers = value;
    }

    return result;
  }, SELECTORS.overview);

  return {
    videoViews: metrics.videoViews,
    profileViews: metrics.profileViews,
    likes: metrics.likes,
    comments: metrics.comments,
    shares: metrics.shares,
    followers: metrics.followers,
    followerGrowth: metrics.followerGrowth,
  };
}
