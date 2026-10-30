// lib/feeds.js
import Parser from "rss-parser";
import {
  cleanText,
  calculateRelevance,
  classifyPillar,
  extractTags,
  extractTechnicalSummary,
  generateThreeBulletSummary,
  computeBadges,
  clusterDuplicates,
} from "./nlp.js";

export const SOURCES = [
  { name: "The Hacker News", category: "security", url: "https://feeds.feedburner.com/TheHackersNews", filterAi: true },
  { name: "The Verge AI", category: "industry", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "arXiv cs.AI", category: "research", url: "https://rss.arxiv.org/rss/cs.AI" },
  { name: "arXiv cs.CL", category: "research", url: "https://rss.arxiv.org/rss/cs.CL" },
  { name: "arXiv cs.LG", category: "research", url: "https://rss.arxiv.org/rss/cs.LG" },
  { name: "Hugging Face Blog", category: "models", url: "https://huggingface.co/blog/feed.xml" },
  {
    name: "Hacker News AI",
    category: "community",
    url: "https://hnrss.org/newest?q=LLM+OR+RAG+OR+KAG+OR+MCP+OR+vLLM+OR+SGLang+OR+DeepSeek+OR+Claude+OR+Anthropic+OR+Cursor+OR+%22reasoning+model%22&points=30",
  },
  { name: "OpenAI News", category: "labs", url: "https://openai.com/news/rss.xml" },
  { name: "Google AI Blog", category: "labs", url: "https://blog.google/technology/ai/rss/" },
  { name: "Simon Willison AI", category: "engineering", url: "https://simonwillison.net/atom/everything/" },
  { name: "Latent Space", category: "engineering", url: "https://www.latent.space/feed" },
  { name: "MarkTechPost AI", category: "engineering", url: "https://www.marktechpost.com/feed/" },
  { name: "r/LocalLLaMA", category: "community", url: "https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day" },
  { name: "r/MachineLearning", category: "community", url: "https://www.reddit.com/r/MachineLearning/top/.rss?t=day" },
];

const parser = new Parser({
  headers: {
    "User-Agent": "MyAIDailyBot/2.0 (AI Engineering News Aggregator; Next.js Vercel)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  timeout: 8000,
});

const AI_FILTER_REGEX =
  /\b(ai|artificial intelligence|claude|openai|anthropic|llm|copilot|cursor|model|models|deepseek|machine learning|agent|agents|reasoning|vllm|sglang|rag|kag|mcp|extension|backdoor|vulnerability)\b/i;

async function fetchSource(src) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(src.url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MyAIDailyBot/2.0",
        Accept: "application/rss+xml, application/atom+xml, text/xml, */*",
      },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const xmlText = await res.text();
    const feed = await parser.parseString(xmlText);

    const filteredItems = (feed.items || []).filter((item) => {
      if (!src.filterAi) return true;
      const combined = (item.title || "") + " " + (item.contentSnippet || item.content || "");
      return AI_FILTER_REGEX.test(combined);
    });

    return filteredItems.slice(0, 10).map((item) => {
      const pubDate = new Date(item.isoDate || item.pubDate || Date.now()).getTime();
      const rawText = cleanText(item.contentSnippet || item.content || item.summary || "");
      const title = cleanText(item.title);

      return {
        id: item.guid || item.link || `${src.name}-${title.slice(0, 35)}`,
        title,
        link: item.link,
        source: src.name,
        sourceCategory: src.category,
        date: isNaN(pubDate) ? Date.now() : pubDate,
        rawText: rawText.slice(0, 1200),
      };
    });
  } catch {
    return [];
  }
}

// Generates 5 executive briefing bullets from the top items of the day
function generateDailyBriefing(items) {
  const topUnique = [];
  const seenTopics = new Set();

  for (const item of items) {
    if (!seenTopics.has(item.pillar) || topUnique.length < 5) {
      seenTopics.add(item.pillar);
      topUnique.push({
        title: item.title,
        source: item.source,
        link: item.link,
        takeaway: item.threeBullets?.whyItMatters || item.summary,
        pillar: item.pillarLabel,
      });
      if (topUnique.length >= 5) break;
    }
  }

  return topUnique;
}

// In-memory cache
let cachedData = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function getNews(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && cachedData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedData;
  }

  const settled = await Promise.allSettled(SOURCES.map(fetchSource));
  const allItems = settled.flatMap((res) => (res.status === "fulfilled" ? res.value : []));

  const seenUrls = new Set();
  const seenTitles = new Set();

  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  const validItems = [];

  for (const item of allItems) {
    if (!item.title || !item.link) continue;
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenUrls.has(item.link) || seenTitles.has(normalizedTitle)) continue;

    const score = calculateRelevance(item.title, item.rawText, item.date);
    // Strict quality gate: ignore items scoring < 6/10
    if (score < 6) continue;

    seenUrls.add(item.link);
    seenTitles.add(normalizedTitle);

    const pillarInfo = classifyPillar(item.title, item.rawText);
    const tags = extractTags(item.title, item.rawText);
    const summary = extractTechnicalSummary(item.rawText, item.title);
    const threeBullets = generateThreeBulletSummary(item.title, item.rawText, tags);
    const badges = computeBadges(item.date, 0, score);

    const ageMs = now - item.date;

    validItems.push({
      id: item.id,
      title: item.title,
      link: item.link,
      source: item.source,
      sourceCategory: item.sourceCategory,
      date: item.date,
      summary,
      threeBullets,
      pillar: pillarInfo.pillar,
      pillarLabel: pillarInfo.label,
      tags,
      score,
      isNew: badges.isNew,
      isRising: badges.isRising,
      isToday: ageMs <= oneDay,
      isThisWeek: ageMs <= oneWeek,
      isThisMonth: ageMs <= oneMonth,
    });
  }

  // Sort by score then date
  validItems.sort((a, b) => b.date - a.date);

  // Group duplicates into primary cards with "Also covered by X sources"
  const clusteredItems = clusterDuplicates(validItems);

  // Generate 5-bullet executive briefing
  const dailyBriefing = generateDailyBriefing(clusteredItems);

  // Collect trending tags
  const tagCounts = {};
  clusteredItems.forEach((item) => {
    item.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, count]) => ({ tag, count }));

  // Collect distinct sources
  const sourceCounts = {};
  clusteredItems.forEach((item) => {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  });
  const activeSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const result = {
    items: clusteredItems,
    dailyBriefing,
    trendingTags,
    activeSources,
    stats: {
      total: clusteredItems.length,
      todayCount: clusteredItems.filter((i) => i.isToday).length,
      weekCount: clusteredItems.filter((i) => i.isThisWeek).length,
      monthCount: clusteredItems.filter((i) => i.isThisMonth).length,
      updatedAt: new Date().toISOString(),
    },
  };

  cachedData = result;
  lastCacheTime = now;

  return result;
}
