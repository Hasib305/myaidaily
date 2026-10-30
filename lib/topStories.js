// lib/topStories.js
// Fetches community-ranked top AI stories across Week, Month, 6 Months, and Year per topic.
// Uses the 100% free, open Hacker News Algolia Search API. Zero tokens, zero API keys.

import {
  extractTechnicalSummary,
  classifyPillar,
  extractTags,
  calculateRelevance,
} from "./nlp.js";

const TOPIC_TERMS = {
  all: ["AI", "LLM", "DeepSeek", "Claude", "GPT"],
  "models-reasoning": ["DeepSeek", "reasoning", "LLM", "o1", "o3", "GRPO", "foundation model"],
  "agents-mcp": ["agent", "agents", "MCP", "Cursor", "Claude Code", "tool calling"],
  "knowledge-retrieval": ["RAG", "KAG", "GraphRAG", "vector database", "embeddings", "hybrid search"],
  "infra-serving": ["vLLM", "SGLang", "quantization", "AWQ", "GGUF", "inference engine", "speculative decoding"],
  "devtools-coding": ["Cursor", "Windsurf", "Claude Code", "copilot", "eval", "fine-tuning", "unsloth"],
  "research-papers": ["arxiv", "paper", "benchmark", "ablation", "architecture"],
};

const TIMEFRAMES_SECONDS = {
  week: 7 * 86400,
  month: 30 * 86400,
  six_months: 180 * 86400,
  year: 365 * 86400,
};

// In-memory cache to prevent repeated external network requests
const topCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache

export async function fetchTopStories({ timeframe = "month", topic = "all" } = {}) {
  const cacheKey = `${timeframe}-${topic}`;
  const nowMs = Date.now();
  const cached = topCache.get(cacheKey);

  if (cached && nowMs - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const durationSec = TIMEFRAMES_SECONDS[timeframe] || TIMEFRAMES_SECONDS.month;
  const timeStart = nowSec - durationSec;

  const terms = TOPIC_TERMS[topic] || TOPIC_TERMS.all;
  const minPoints = (timeframe === "week" || timeframe === "month") ? 20 : 40;

  try {
    const results = await Promise.allSettled(
      terms.map(async (term) => {
        const numericFilter = `created_at_i>${timeStart},points>${minPoints}`;
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(term)}&tags=story&numericFilters=${encodeURIComponent(numericFilter)}&hitsPerPage=20`;

        const res = await fetch(url, {
          headers: { "User-Agent": "MyAIDailyBot/2.0" },
          signal: AbortSignal.timeout(7000),
        });

        if (!res.ok) return [];
        const json = await res.json();
        return json.hits || [];
      })
    );

    const allHits = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

    const seen = new Set();
    const processed = allHits
      .filter((h) => {
        if (!h.title || seen.has(h.objectID)) return false;
        seen.add(h.objectID);
        return true;
      })
      .map((h) => {
        const title = h.title.trim();
        const link = h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`;
        const rawText = h.story_text || title;
        const pubDate = (h.created_at_i || Math.floor(Date.now() / 1000)) * 1000;

        const summary = extractTechnicalSummary(rawText, title);
        const pillarInfo = classifyPillar(title, rawText);
        const tags = extractTags(title, rawText);
        const score = calculateRelevance(title, rawText, pubDate);

        return {
          id: `hn-${h.objectID}`,
          title,
          link,
          source: "Hacker News Top",
          sourceCategory: "top-community",
          date: pubDate,
          summary,
          pillar: pillarInfo.pillar,
          pillarLabel: pillarInfo.label,
          tags,
          score,
          points: h.points || 0,
          commentsCount: h.num_comments || 0,
          hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        };
      })
      .sort((a, b) => b.points - a.points); // Rank strictly by community upvotes!

    topCache.set(cacheKey, { timestamp: nowMs, data: processed });
    return processed;
  } catch (err) {
    console.error("fetchTopStories error:", err.message);
    return [];
  }
}
