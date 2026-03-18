import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { mkdirSync } from 'fs';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';

let context: BrowserContext | null = null;
let page: Page | null = null;

export async function getPage(): Promise<Page> {
  if (page && !page.isClosed()) {
    return page;
  }

  mkdirSync(config.browserStateDir, { recursive: true });

  logger.info('Launching browser', config.tiktok.headful ? '(headful)' : '(headless)');

  context = await chromium.launchPersistentContext(config.browserStateDir, {
    headless: !config.tiktok.headful,
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  page = context.pages()[0] || await context.newPage();

  // Mask automation signals
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  logger.info('Browser ready');
  return page;
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
    page = null;
    logger.info('Browser closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
