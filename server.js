import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve static Vite build
app.use(express.static(join(__dirname, 'dist')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Scrape a Clayton Homes listing URL
async function scrapeListing(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Extract what we can from the page
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';

  // Try to get all visible text content from the main body
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

  // Try to find images
  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && (src.includes('home') || src.includes('house') || src.includes('model') || src.includes('jpg') || src.includes('png'))) {
      images.push({ src, alt });
    }
  });

  return {
    url,
    title,
    metaDesc,
    ogTitle,
    ogDesc,
    bodyText,
    imageCount: images.length,
    images: images.slice(0, 5),
  };
}

// Generate content using Claude
async function generateContent(listingData) {
  const prompt = `You are a TikTok content strategist for a Clayton Homes sales consultant. Based on the following home listing data, generate TikTok content.

LISTING DATA:
URL: ${listingData.url}
Title: ${listingData.title}
Description: ${listingData.metaDesc || listingData.ogDesc}
OG Title: ${listingData.ogTitle}
Page Content: ${listingData.bodyText}

IMPORTANT RULES:
- Do NOT mention specific prices since every buyer's price varies based on credit score and financing
- Focus on the home's features, lifestyle, and emotional appeal
- Use language that sounds natural for TikTok (conversational, energetic, relatable)
- Reference specific details from the listing (sqft, beds, baths, features, model name if available)

Generate the following in JSON format:

{
  "homeSummary": "Brief 1-2 sentence summary of the home for reference",
  "hooks": [
    { "style": "curiosity", "text": "..." },
    { "style": "emotional", "text": "..." },
    { "style": "mythBuster", "text": "..." }
  ],
  "caption": "Full TikTok caption ready to paste. Include a CTA like 'DM me HOME' or 'Comment INFO'. 2-4 short paragraphs.",
  "hashtags": ["#tag1", "#tag2", "..."],
  "shotList": [
    { "shot": 1, "description": "What to film", "duration": "5-10 sec", "tip": "Pro tip for this shot" },
    { "shot": 2, "description": "...", "duration": "...", "tip": "..." }
  ],
  "postingStrategy": {
    "bestDay": "e.g. Monday",
    "bestTime": "e.g. 11 AM - 1 PM EST",
    "contentType": "e.g. Home Tour",
    "reasoning": "Why this day/time works for this content"
  }
}

Return ONLY the JSON, no other text.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;

  // Parse the JSON from Claude's response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI response');

  return JSON.parse(jsonMatch[0]);
}

// API endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const listingData = await scrapeListing(url);
    const content = await generateContent(listingData);

    res.json({ success: true, content });
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate content' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
