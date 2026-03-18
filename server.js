import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve static Vite build
app.use(express.static(join(__dirname, 'dist')));

// The prompt used for both providers
function buildPrompt(listingData) {
  return `You are a TikTok content strategist for a Clayton Homes sales consultant. Based on the following home listing data, generate TikTok content.

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
}

// Scrape a Clayton Homes listing URL
async function scrapeListing(url) {
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

  const images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    if (src && (src.includes('home') || src.includes('house') || src.includes('model') || src.includes('jpg') || src.includes('png'))) {
      images.push({ src, alt });
    }
  });

  return { url, title, metaDesc, ogTitle, ogDesc, bodyText, imageCount: images.length, images: images.slice(0, 5) };
}

// Generate with Claude (Anthropic)
async function generateWithClaude(prompt, apiKey) {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content[0].text;
}

// Generate with ChatGPT (OpenAI)
async function generateWithOpenAI(prompt, apiKey) {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
}

// Parse JSON from AI response
function parseAIResponse(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI response');
  return JSON.parse(jsonMatch[0]);
}

// Demo content for testing without an API key
function getDemoContent(listingData) {
  const title = listingData.title || 'Clayton Home';
  return {
    homeSummary: `Beautiful ${title} — a stunning manufactured home with modern finishes, open floor plan, and energy-efficient features that prove affordable homeownership is within reach.`,
    hooks: [
      { style: "curiosity", text: `Wait until you see what's inside this ${title}... I've shown hundreds of homes and this one still gets me.` },
      { style: "emotional", text: `She walked in and couldn't believe this was HER home. This is why I do what I do.` },
      { style: "mythBuster", text: `People say manufactured homes aren't real homes. Walk through this one and say that again.` },
    ],
    caption: `This home right here is the reason people are rethinking everything they thought they knew about manufactured homes.\n\nOpen floor plan. Modern kitchen. Spacious bedrooms. And the best part? It's more affordable than you think.\n\nStop scrolling and DM me "HOME" — I'll send you everything you need to know about this one.`,
    hashtags: ["#ClaytonHomes", "#ManufacturedHomes", "#AffordableHousing", "#FirstTimeHomeBuyer", "#HomeTour", "#DreamHome", "#NewHome2026", "#HomeGoals", "#RealEstateTips", "#FYP"],
    shotList: [
      { shot: 1, description: "Exterior wide shot — walk up to the front door", duration: "5-8 sec", tip: "Start with the curb appeal. Film from the street walking toward the home." },
      { shot: 2, description: "Open the front door — first reveal of the interior", duration: "3-5 sec", tip: "Pause at the door for a beat. Let the viewer anticipate the reveal." },
      { shot: 3, description: "Pan across the open floor plan living area", duration: "8-10 sec", tip: "Slow, steady pan. Let the space speak for itself." },
      { shot: 4, description: "Kitchen close-ups — countertops, appliances, island", duration: "8-10 sec", tip: "Kitchens sell homes. Show every detail." },
      { shot: 5, description: "Master bedroom and bathroom reveal", duration: "10-12 sec", tip: "Save this for the end if it's the showstopper. Build anticipation." },
      { shot: 6, description: "Closing shot — you on camera with CTA", duration: "5-8 sec", tip: "Look at the camera. 'DM me HOME for details.' Keep it natural." },
    ],
    postingStrategy: {
      bestDay: "Monday",
      bestTime: "11 AM - 1 PM EST",
      contentType: "Home Tour",
      reasoning: "Monday home tours perform best as people start their week dreaming about new beginnings. Late morning catches the lunch-break scroll.",
    },
  };
}

// Fetch all home listings from Clayton sitemap
async function fetchHomeListings() {
  const res = await fetch('https://www.claytonhomes.com/sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  const homeUrls = [];
  $('url loc').each((_, el) => {
    const loc = $(el).text();
    if (/\/homes\/[A-Z0-9]+\/$/.test(loc)) {
      homeUrls.push(loc);
    }
  });
  return homeUrls;
}

// Scrape basic details from a single home listing page
async function scrapeHomeDetails(url) {
  try {
    const data = await scrapeListing(url);
    const modelId = url.match(/\/homes\/([^/]+)/)?.[1] || '';
    return {
      url,
      modelId,
      title: (data.ogTitle || data.title || '').replace(/\s*\|.*$/, '').trim(),
      description: data.metaDesc || data.ogDesc || '',
      image: null,
    };
  } catch {
    return { url, modelId: url.match(/\/homes\/([^/]+)/)?.[1] || '', title: '', description: '', image: null };
  }
}

// Get all listings (returns URLs, scrapes details in batches)
app.get('/api/listings', async (req, res) => {
  try {
    const urls = await fetchHomeListings();
    res.json({ success: true, count: urls.length, listings: urls.map(url => ({
      url,
      modelId: url.match(/\/homes\/([^/]+)/)?.[1] || '',
    })) });
  } catch (err) {
    console.error('Listings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get details for a specific listing
app.get('/api/listings/details', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const details = await scrapeHomeDetails(url);
    res.json({ success: true, details });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listing details' });
  }
});

// API endpoint
app.post('/api/generate', async (req, res) => {
  try {
    const { url, provider, apiKey } = req.body;

    if (!url) return res.status(400).json({ error: 'URL is required' });

    const listingData = await scrapeListing(url);

    // Demo mode — no API key needed
    if (!apiKey || apiKey === 'demo') {
      const content = getDemoContent(listingData);
      return res.json({ success: true, content });
    }

    if (!provider) return res.status(400).json({ error: 'Provider is required' });

    const prompt = buildPrompt(listingData);

    let text;
    if (provider === 'anthropic') {
      text = await generateWithClaude(prompt, apiKey);
    } else if (provider === 'openai') {
      text = await generateWithOpenAI(prompt, apiKey);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    const content = parseAIResponse(text);
    res.json({ success: true, content });
  } catch (err) {
    console.error('Generation error:', err);

    // Provide friendly error messages for common issues
    let errorMsg = err.message || 'Failed to generate content';
    if (err.status === 401 || errorMsg.includes('auth') || errorMsg.includes('API key')) {
      errorMsg = 'Invalid API key. Please check your key in settings.';
    } else if (err.status === 429) {
      errorMsg = 'Rate limited. Please wait a moment and try again.';
    } else if (err.status === 402 || errorMsg.includes('billing') || errorMsg.includes('quota')) {
      errorMsg = 'Your API account needs billing setup or has exceeded its quota.';
    }

    res.status(500).json({ error: errorMsg });
  }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
