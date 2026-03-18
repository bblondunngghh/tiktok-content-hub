import type { Page } from 'playwright';
import { SELECTORS } from '../selectors.js';
import { logger } from '../../utils/logger.js';

export interface VideoData {
  videoId: string;
  description: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  avgWatchTimeSeconds: number | null;
  postedAt: string | null;
}

const CONTENT_URL = 'https://www.tiktok.com/creator-center/analytics?tab=content';

export async function scrapeContent(page: Page, maxVideos: number = 20): Promise<VideoData[]> {
  logger.info(`Scraping content analytics (max ${maxVideos} videos)`);

  await page.goto(CONTENT_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const allVideos: VideoData[] = [];
  let pageNum = 1;

  while (allVideos.length < maxVideos) {
    logger.info(`Scraping content page ${pageNum}...`);
    const videos = await extractVideosFromPage(page);

    if (videos.length === 0) {
      logger.info('No more videos found');
      break;
    }

    allVideos.push(...videos);

    if (allVideos.length >= maxVideos) break;

    // Try to go to next page
    const hasNextPage = await goToNextPage(page);
    if (!hasNextPage) break;

    pageNum++;
    await page.waitForTimeout(2000);
  }

  return allVideos.slice(0, maxVideos);
}

async function extractVideosFromPage(page: Page): Promise<VideoData[]> {
  return page.evaluate((selectors) => {
    const videos: VideoData[] = [];

    // Find video rows
    const rowSelectors = selectors.videoRow.split(', ');
    let rows: Element[] = [];
    for (const sel of rowSelectors) {
      rows = Array.from(document.querySelectorAll(sel));
      if (rows.length > 0) break;
    }

    for (const row of rows) {
      // Extract video ID from link
      let videoId = '';
      const linkSelectors = selectors.videoLink.split(', ');
      for (const sel of linkSelectors) {
        const link = row.querySelector(sel) as HTMLAnchorElement | null;
        if (link?.href) {
          const match = link.href.match(/\/video\/(\d+)/);
          videoId = match ? match[1] : `unknown-${Date.now()}-${Math.random()}`;
          break;
        }
      }
      if (!videoId) {
        videoId = `row-${videos.length}-${Date.now()}`;
      }

      function getText(selectorStr: string): string | null {
        const sels = selectorStr.split(', ');
        for (const sel of sels) {
          const el = row.querySelector(sel);
          if (el?.textContent?.trim()) return el.textContent.trim();
        }
        return null;
      }

      function getNum(selectorStr: string): number | null {
        const text = getText(selectorStr);
        if (!text) return null;
        const num = text.replace(/[^0-9.]/g, '');
        return num ? parseFloat(num) : null;
      }

      function parseWatchTime(selectorStr: string): number | null {
        const text = getText(selectorStr);
        if (!text) return null;
        // Handle formats like "0:45", "1:23", "45s", "1m 23s"
        const colonMatch = text.match(/(\d+):(\d+)/);
        if (colonMatch) {
          return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
        }
        const minsMatch = text.match(/(\d+)\s*m/);
        const secsMatch = text.match(/(\d+)\s*s/);
        let seconds = 0;
        if (minsMatch) seconds += parseInt(minsMatch[1], 10) * 60;
        if (secsMatch) seconds += parseInt(secsMatch[1], 10);
        return seconds > 0 ? seconds : null;
      }

      videos.push({
        videoId,
        description: getText(selectors.videoDescription),
        views: getNum(selectors.videoViews),
        likes: getNum(selectors.videoLikes),
        comments: getNum(selectors.videoComments),
        shares: getNum(selectors.videoShares),
        avgWatchTimeSeconds: parseWatchTime(selectors.videoAvgWatchTime),
        postedAt: getText(selectors.videoPostedAt),
      });
    }

    return videos;
  }, SELECTORS.content);
}

async function goToNextPage(page: Page): Promise<boolean> {
  try {
    const nextSelectors = SELECTORS.content.nextPage.split(', ');
    for (const sel of nextSelectors) {
      const nextButton = await page.$(sel);
      if (nextButton) {
        const isDisabled = await nextButton.getAttribute('disabled');
        if (isDisabled !== null) return false;
        await nextButton.click();
        await page.waitForTimeout(2000);
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
