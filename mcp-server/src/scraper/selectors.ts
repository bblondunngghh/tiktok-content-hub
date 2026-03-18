/**
 * Centralized CSS selectors for TikTok Creator Center pages.
 * TikTok frequently changes their DOM — update selectors here when scraping breaks.
 * Each selector can be a string or array of fallback strings.
 */

export const SELECTORS = {
  auth: {
    emailLoginOption: '[data-e2e="channel-item-email"]',
    emailTab: 'a[href*="email"], [data-e2e="login-email-tab"]',
    emailInput: 'input[name="username"], input[placeholder*="email"], input[placeholder*="Email"]',
    passwordInput: 'input[type="password"], input[name="password"]',
    loginButton: 'button[type="submit"], [data-e2e="login-button"]',
    analyticsIndicator: '[class*="analytics"], [data-e2e="analytics-page"], .creator-center-content',
  },

  overview: {
    // Period selector tabs
    periodTab7d: '[data-e2e="7-days"], button:has-text("Last 7 days")',
    periodTab28d: '[data-e2e="28-days"], button:has-text("Last 28 days")',
    periodTab60d: '[data-e2e="60-days"], button:has-text("Last 60 days")',

    // Metric cards
    videoViews: '[data-e2e="video-views"] .count, [class*="video-views"] [class*="count"]',
    profileViews: '[data-e2e="profile-views"] .count, [class*="profile-views"] [class*="count"]',
    likes: '[data-e2e="likes"] .count, [class*="likes-count"]',
    comments: '[data-e2e="comments"] .count, [class*="comments-count"]',
    shares: '[data-e2e="shares"] .count, [class*="shares-count"]',
    followers: '[data-e2e="followers"] .count, [class*="follower-count"]',
    followerGrowth: '[data-e2e="follower-growth"], [class*="follower-growth"]',

    // Generic metric card pattern (fallback)
    metricCards: '[class*="metric-card"], [class*="DataCard"], [class*="data-card"]',
    metricLabel: '[class*="metric-label"], [class*="card-title"], [class*="DataCard"] h3',
    metricValue: '[class*="metric-value"], [class*="card-value"], [class*="DataCard"] [class*="count"]',
  },

  content: {
    // Video list container
    videoList: '[class*="video-list"], [class*="content-list"], table tbody',
    videoRow: '[class*="video-item"], [class*="content-item"], table tbody tr',

    // Per-video selectors (relative to videoRow)
    videoThumbnail: 'img, [class*="thumbnail"]',
    videoDescription: '[class*="video-title"], [class*="description"], td:nth-child(2)',
    videoViews: '[class*="views"], td:nth-child(3)',
    videoLikes: '[class*="likes"], td:nth-child(4)',
    videoComments: '[class*="comments"], td:nth-child(5)',
    videoShares: '[class*="shares"], td:nth-child(6)',
    videoAvgWatchTime: '[class*="watch-time"], [class*="avg-watch"], td:nth-child(7)',
    videoPostedAt: '[class*="post-time"], [class*="date"], td:nth-child(8)',
    videoLink: 'a[href*="/video/"]',

    // Pagination
    nextPage: '[class*="next-page"], button:has-text("Next")',
  },

  followers: {
    // Demographics sections
    genderSection: '[class*="gender"], [data-e2e="gender-distribution"]',
    ageSection: '[class*="age"], [data-e2e="age-distribution"]',
    countrySection: '[class*="territory"], [class*="country"], [data-e2e="top-territories"]',
    activeHoursSection: '[class*="active-time"], [class*="active-hours"], [data-e2e="follower-activity"]',

    // Data elements within sections
    genderBar: '[class*="gender-bar"], [class*="bar-item"]',
    ageBar: '[class*="age-bar"], [class*="bar-item"]',
    countryRow: '[class*="territory-item"], [class*="country-item"]',
    heatmapCell: '[class*="heatmap-cell"], [class*="hour-cell"]',

    // Labels and values within bars
    barLabel: '[class*="label"], span:first-child',
    barValue: '[class*="value"], [class*="percentage"], span:last-child',
  },
} as const;
