import type { Page } from 'playwright';
import { SELECTORS } from '../selectors.js';
import { logger } from '../../utils/logger.js';

export interface FollowerData {
  genderSplit: Record<string, number>;
  ageDistribution: Record<string, number>;
  topCountries: Record<string, number>;
  activeHours: Record<string, number[]>;
}

const FOLLOWERS_URL = 'https://www.tiktok.com/creator-center/analytics?tab=followers';

export async function scrapeFollowers(page: Page): Promise<FollowerData> {
  logger.info('Scraping follower demographics');

  await page.goto(FOLLOWERS_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const [genderSplit, ageDistribution, topCountries, activeHours] = await Promise.all([
    extractGender(page),
    extractAge(page),
    extractCountries(page),
    extractActiveHours(page),
  ]);

  return { genderSplit, ageDistribution, topCountries, activeHours };
}

async function extractGender(page: Page): Promise<Record<string, number>> {
  try {
    return await page.evaluate((selectors) => {
      const result: Record<string, number> = {};

      // Find gender section
      const sectionSels = selectors.genderSection.split(', ');
      let section: Element | null = null;
      for (const sel of sectionSels) {
        section = document.querySelector(sel);
        if (section) break;
      }
      if (!section) return result;

      // Find bars within section
      const barSels = selectors.genderBar.split(', ');
      let bars: Element[] = [];
      for (const sel of barSels) {
        bars = Array.from(section.querySelectorAll(sel));
        if (bars.length > 0) break;
      }

      const labelSels = selectors.barLabel.split(', ');
      const valueSels = selectors.barValue.split(', ');

      for (const bar of bars) {
        let label = '';
        for (const sel of labelSels) {
          const el = bar.querySelector(sel);
          if (el?.textContent?.trim()) { label = el.textContent.trim(); break; }
        }
        let value = 0;
        for (const sel of valueSels) {
          const el = bar.querySelector(sel);
          if (el?.textContent) {
            const num = el.textContent.replace(/[^0-9.]/g, '');
            if (num) { value = parseFloat(num); break; }
          }
        }
        if (label) result[label] = value;
      }
      return result;
    }, SELECTORS.followers);
  } catch {
    logger.warn('Could not extract gender data');
    return {};
  }
}

async function extractAge(page: Page): Promise<Record<string, number>> {
  try {
    return await page.evaluate((selectors) => {
      const result: Record<string, number> = {};

      const sectionSels = selectors.ageSection.split(', ');
      let section: Element | null = null;
      for (const sel of sectionSels) {
        section = document.querySelector(sel);
        if (section) break;
      }
      if (!section) return result;

      const barSels = selectors.ageBar.split(', ');
      let bars: Element[] = [];
      for (const sel of barSels) {
        bars = Array.from(section.querySelectorAll(sel));
        if (bars.length > 0) break;
      }

      const labelSels = selectors.barLabel.split(', ');
      const valueSels = selectors.barValue.split(', ');

      for (const bar of bars) {
        let label = '';
        for (const sel of labelSels) {
          const el = bar.querySelector(sel);
          if (el?.textContent?.trim()) { label = el.textContent.trim(); break; }
        }
        let value = 0;
        for (const sel of valueSels) {
          const el = bar.querySelector(sel);
          if (el?.textContent) {
            const num = el.textContent.replace(/[^0-9.]/g, '');
            if (num) { value = parseFloat(num); break; }
          }
        }
        if (label) result[label] = value;
      }
      return result;
    }, SELECTORS.followers);
  } catch {
    logger.warn('Could not extract age data');
    return {};
  }
}

async function extractCountries(page: Page): Promise<Record<string, number>> {
  try {
    return await page.evaluate((selectors) => {
      const result: Record<string, number> = {};

      const sectionSels = selectors.countrySection.split(', ');
      let section: Element | null = null;
      for (const sel of sectionSels) {
        section = document.querySelector(sel);
        if (section) break;
      }
      if (!section) return result;

      const rowSels = selectors.countryRow.split(', ');
      let rows: Element[] = [];
      for (const sel of rowSels) {
        rows = Array.from(section.querySelectorAll(sel));
        if (rows.length > 0) break;
      }

      const labelSels = selectors.barLabel.split(', ');
      const valueSels = selectors.barValue.split(', ');

      for (const row of rows) {
        let label = '';
        for (const sel of labelSels) {
          const el = row.querySelector(sel);
          if (el?.textContent?.trim()) { label = el.textContent.trim(); break; }
        }
        let value = 0;
        for (const sel of valueSels) {
          const el = row.querySelector(sel);
          if (el?.textContent) {
            const num = el.textContent.replace(/[^0-9.]/g, '');
            if (num) { value = parseFloat(num); break; }
          }
        }
        if (label) result[label] = value;
      }
      return result;
    }, SELECTORS.followers);
  } catch {
    logger.warn('Could not extract country data');
    return {};
  }
}

async function extractActiveHours(page: Page): Promise<Record<string, number[]>> {
  try {
    return await page.evaluate((selectors) => {
      const result: Record<string, number[]> = {};
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const sectionSels = selectors.activeHoursSection.split(', ');
      let section: Element | null = null;
      for (const sel of sectionSels) {
        section = document.querySelector(sel);
        if (section) break;
      }
      if (!section) return result;

      // Try to extract heatmap data
      const cellSels = selectors.heatmapCell.split(', ');
      let cells: Element[] = [];
      for (const sel of cellSels) {
        cells = Array.from(section.querySelectorAll(sel));
        if (cells.length > 0) break;
      }

      // Initialize days
      for (const day of days) {
        result[day] = new Array(24).fill(0);
      }

      // Parse heatmap cells (7 days x 24 hours = 168 cells typically)
      cells.forEach((cell, index) => {
        const dayIndex = Math.floor(index / 24);
        const hour = index % 24;
        if (dayIndex < days.length) {
          // Try data attribute, title, or aria-label for value
          const value = cell.getAttribute('data-value')
            || cell.getAttribute('title')
            || cell.getAttribute('aria-label')
            || cell.textContent;
          const num = value ? parseFloat(value.replace(/[^0-9.]/g, '')) : 0;
          result[days[dayIndex]][hour] = isNaN(num) ? 0 : num;
        }
      });

      return result;
    }, SELECTORS.followers);
  } catch {
    logger.warn('Could not extract active hours data');
    return {};
  }
}
