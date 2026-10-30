// lib/topStories.js
// Fetches community-ranked top AI stories across Week, Month, 6 Months, and Year per topic.
// Uses the 100% free, open Hacker News Algolia Search API. Zero tokens, zero API keys.

import {
  extractTechnicalSummary,
  classifyPillar,
  extractTags,
  calculateRelevance,
} from "./nlp.js";

const TOPIC_QUERIES = {
  all: "AI OR LLM OR DeepSeek OR MCP OR RAG OR vLLM OR agent",
  "models-reasoning": "DeepSeek OR reasoning OR o1 OR o3 OR LLM OR GRPO OR MLA OR foundation model",
  "agents-mcp": "MCP OR agent OR agents OR Cursor OR Claude Code OR LangGraph OR tool calling",
  "knowledge-retrieval": "RAG OR KAG OR GraphRAG OR vector database OR embeddings OR hybrid search",
  "infra-serving": "vLLM OR SGLang OR quantization OR AWQ OR GGUF OR TensorRT OR inference engine",
  "devtools-coding": "Cursor OR Windsurf OR Claude Code OR eval OR fine-tuning OR unsloth OR DSPy",
  "research-papers": "arxiv OR paper OR benchmark OR ablation OR architecture",
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

  const query = TOPIC_QUERIES[topic] || TOPIC_QUERIES.all;

  // Filter thresholds: newer timeframes use lower point thresholds so recent gems appear
  const minPoints = timeframe === "week" ? 25 : timeframe === "month" ? 40 : 60;

  const numericFilter = `created_at_i>${timeStart},points>${minPoints}`;
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=${encodeURIComponent(numericFilter)}&hitsPerPage=30`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "MyAIDailyBot/2.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const json = await res.json();
    const hits = json.hits || [];

    const processed = hits
      .filter((h) => h.title && (h.url || h.story_url || h.objectID))
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
