import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../../.env') });

export const config = {
  tiktok: {
    username: process.env.TIKTOK_USERNAME || '',
    password: process.env.TIKTOK_PASSWORD || '',
    headful: process.env.TIKTOK_HEADFUL === 'true',
  },
  scrapeIntervalSeconds: parseInt(process.env.SCRAPE_INTERVAL_SECONDS || '30', 10),
  dataDir: resolve(__dirname, '../../data'),
  browserStateDir: resolve(__dirname, '../../data/browser-state'),
  dbPath: resolve(__dirname, '../../data/analytics.db'),
};
