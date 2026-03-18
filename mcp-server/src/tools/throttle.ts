import { config } from '../utils/config.js';

let lastScrapeTime = 0;

export function checkScrapeThrottle(): void {
  const now = Date.now();
  const elapsed = (now - lastScrapeTime) / 1000;
  if (lastScrapeTime > 0 && elapsed < config.scrapeIntervalSeconds) {
    throw new Error(
      `Rate limit: please wait ${Math.ceil(config.scrapeIntervalSeconds - elapsed)} seconds before scraping again.`
    );
  }
}

export function updateScrapeTime(): void {
  lastScrapeTime = Date.now();
}
