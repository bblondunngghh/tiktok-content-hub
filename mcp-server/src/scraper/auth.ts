import type { Page } from 'playwright';
import { config } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { SELECTORS } from './selectors.js';

const CREATOR_CENTER_URL = 'https://www.tiktok.com/creator-center/analytics';
const LOGIN_URL = 'https://www.tiktok.com/login';

export async function ensureAuthenticated(page: Page): Promise<void> {
  logger.info('Checking TikTok authentication...');

  await page.goto(CREATOR_CENTER_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Check if we landed on the analytics page (already authenticated)
  const isLoggedIn = await checkIfLoggedIn(page);
  if (isLoggedIn) {
    logger.info('Already authenticated');
    return;
  }

  logger.info('Not authenticated, starting login flow...');
  await performLogin(page);
}

async function checkIfLoggedIn(page: Page): Promise<boolean> {
  try {
    // If we're on the analytics page, we're logged in
    const url = page.url();
    if (url.includes('/creator-center/analytics')) {
      // Wait briefly for content to load
      await page.waitForSelector(SELECTORS.auth.analyticsIndicator, { timeout: 5000 });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function performLogin(page: Page): Promise<void> {
  if (!config.tiktok.username || !config.tiktok.password) {
    throw new Error(
      'TikTok credentials not configured. Set TIKTOK_USERNAME and TIKTOK_PASSWORD environment variables.'
    );
  }

  // Navigate to login page
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for and click "Log in with email/username"
  try {
    const emailLoginOption = await page.waitForSelector(SELECTORS.auth.emailLoginOption, { timeout: 10000 });
    if (emailLoginOption) {
      await emailLoginOption.click();
      await page.waitForTimeout(1000);
    }
  } catch {
    logger.warn('Could not find email login option, may already be on email form');
  }

  // Switch to "Log in with email" tab if needed
  try {
    const emailTab = await page.waitForSelector(SELECTORS.auth.emailTab, { timeout: 5000 });
    if (emailTab) {
      await emailTab.click();
      await page.waitForTimeout(500);
    }
  } catch {
    logger.debug('Email tab not found, may already be selected');
  }

  // Fill credentials
  const emailInput = await page.waitForSelector(SELECTORS.auth.emailInput, { timeout: 10000 });
  if (!emailInput) throw new Error('Could not find email input');
  await emailInput.fill(config.tiktok.username);
  await page.waitForTimeout(500);

  const passwordInput = await page.waitForSelector(SELECTORS.auth.passwordInput, { timeout: 5000 });
  if (!passwordInput) throw new Error('Could not find password input');
  await passwordInput.fill(config.tiktok.password);
  await page.waitForTimeout(500);

  // Click login button
  const loginButton = await page.waitForSelector(SELECTORS.auth.loginButton, { timeout: 5000 });
  if (!loginButton) throw new Error('Could not find login button');
  await loginButton.click();

  // Wait for navigation — may hit CAPTCHA here
  logger.info('Login submitted. Waiting for authentication (may require CAPTCHA)...');

  if (config.tiktok.headful) {
    // In headful mode, give user time to solve CAPTCHA manually
    logger.info('>>> If you see a CAPTCHA, please solve it in the browser window <<<');
    try {
      await page.waitForURL('**/creator-center/**', { timeout: 120000 });
    } catch {
      throw new Error('Login timed out after 2 minutes. Did the CAPTCHA get solved?');
    }
  } else {
    // In headless mode, CAPTCHA will likely fail
    try {
      await page.waitForURL('**/creator-center/**', { timeout: 15000 });
    } catch {
      throw new Error(
        'Login failed in headless mode (likely CAPTCHA). Run with TIKTOK_HEADFUL=true for first-time login.'
      );
    }
  }

  logger.info('Successfully authenticated with TikTok');
}
