// lib/feeds.js
import Parser from "rss-parser";
import {
  extractTechnicalSummary,
  classifyPillar,
  extractTags,
  calculateRelevance,
} from "./nlp.js";

export const SOURCES = [
  { name: "The Hacker News", category: "security", url: "https://feeds.feedburner.com/TheHackersNews", filterAi: true },
  { name: "The Verge: AI", category: "industry", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "arXiv: cs.AI", category: "research", url: "https://rss.arxiv.org/rss/cs.AI" },
  { name: "arXiv: cs.CL", category: "research", url: "https://rss.arxiv.org/rss/cs.CL" },
  { name: "arXiv: cs.LG", category: "research", url: "https://rss.arxiv.org/rss/cs.LG" },
  { name: "Hugging Face Blog", category: "models", url: "https://huggingface.co/blog/feed.xml" },
  {
    name: "Hacker News: AI",
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

const cleanString = (str = "") =>
  str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

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
      const rawText = cleanString(item.contentSnippet || item.content || item.summary || "");
      const title = cleanString(item.title);

      return {
        id: item.guid || item.link || `${src.name}-${title.slice(0, 35)}`,
        title,
        link: item.link,
        source: src.name,
        sourceCategory: src.category,
        date: isNaN(pubDate) ? Date.now() : pubDate,
        rawText: rawText.slice(0, 1000),
      };
    });
  } catch {
    return [];
  }
}

// In-memory cache for fast repeated requests
let cachedData = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

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

  const processed = allItems
    .filter((item) => {
      if (!item.title || !item.link) return false;
      const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seenUrls.has(item.link) || seenTitles.has(normalizedTitle)) return false;
      seenUrls.add(item.link);
      seenTitles.add(normalizedTitle);
      return true;
    })
    .map((item) => {
      const summary = extractTechnicalSummary(item.rawText, item.title);
      const pillarInfo = classifyPillar(item.title, item.rawText);
      const tags = extractTags(item.title, item.rawText);
      const score = calculateRelevance(item.title, item.rawText, item.date);

      const ageMs = now - item.date;

      return {
        id: item.id,
        title: item.title,
        link: item.link,
        source: item.source,
        sourceCategory: item.sourceCategory,
        date: item.date,
        summary,
        pillar: pillarInfo.pillar,
        pillarLabel: pillarInfo.label,
        tags,
        score,
        isToday: ageMs <= oneDay,
        isThisWeek: ageMs <= oneWeek,
        isThisMonth: ageMs <= oneMonth,
      };
    })
    .sort((a, b) => b.date - a.date);

  const result = {
    items: processed,
    stats: {
      total: processed.length,
      todayCount: processed.filter((i) => i.isToday).length,
      weekCount: processed.filter((i) => i.isThisWeek).length,
      monthCount: processed.filter((i) => i.isThisMonth).length,
      updatedAt: new Date().toISOString(),
    },
  };

  cachedData = result;
  lastCacheTime = now;

  return result;
}
