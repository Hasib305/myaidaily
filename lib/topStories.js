// lib/topStories.js
// Aggregates top AI stories and papers across Week, Month, 6 Months, and Year per topic.
// Ingests real publishers (Anthropic, OpenAI, arXiv, GitHub, Google AI, The Hacker News) + Hugging Face Papers.
// 100% free, zero tokens, zero API keys.

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

function resolvePublisher(url) {
  if (!url) return "Tech Community";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("arxiv.org")) return "arXiv";
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("huggingface.co")) return "Hugging Face";
    if (host.includes("anthropic.com")) return "Anthropic";
    if (host.includes("openai.com")) return "OpenAI";
    if (host.includes("deepmind.google") || host.includes("blog.google")) return "Google AI";
    if (host.includes("thehackernews.com")) return "The Hacker News";
    if (host.includes("theverge.com")) return "The Verge";
    if (host.includes("simonwillison.net")) return "Simon Willison";
    if (host.includes("latent.space")) return "Latent Space";
    if (host.includes("about.fb.com") || host.includes("meta.com")) return "Meta AI";
    if (host.includes("microsoft.com")) return "Microsoft Research";
    if (host.includes("ycombinator.com")) return "Tech Community";
    return host;
  } catch {
    return "Tech Community";
  }
}

// In-memory cache to prevent repeated external network requests
const topCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache

// Fetch top papers from Hugging Face Papers API
async function fetchHFPapers() {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers", {
      headers: { "User-Agent": "MyAIDailyBot/2.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const p = item.paper || item;
      const title = p.title || item.title || "";
      const rawText = p.summary || item.summary || title;
      const pubDate = new Date(p.publishedAt || item.publishedAt || Date.now()).getTime();

      const summary = extractTechnicalSummary(rawText, title);
      const pillarInfo = classifyPillar(title, rawText);
      const tags = extractTags(title, rawText);
      const score = calculateRelevance(title, rawText, pubDate);

      return {
        id: `hf-${p.id || title.slice(0, 30)}`,
        title,
        link: `https://huggingface.co/papers/${p.id}`,
        source: "Hugging Face Papers",
        sourceCategory: "research",
        date: pubDate,
        summary,
        pillar: pillarInfo.pillar,
        pillarLabel: pillarInfo.label,
        tags,
        score,
        points: p.upvotes || 0,
      };
    });
  } catch {
    return [];
  }
}

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
  const minPoints = timeframe === "week" || timeframe === "month" ? 20 : 40;

  try {
    // 1. Fetch community-upvoted stories across all publishers
    const algoliaPromises = terms.map(async (term) => {
      const numericFilter = `created_at_i>${timeStart},points>${minPoints}`;
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(term)}&tags=story&numericFilters=${encodeURIComponent(numericFilter)}&hitsPerPage=20`;

      const res = await fetch(url, {
        headers: { "User-Agent": "MyAIDailyBot/2.0" },
        signal: AbortSignal.timeout(7000),
      });

      if (!res.ok) return [];
      const json = await res.json();
      return json.hits || [];
    });

    // 2. Fetch Hugging Face top research papers
    const hfPromise = fetchHFPapers();

    const [algoliaResults, hfPapers] = await Promise.all([
      Promise.allSettled(algoliaPromises),
      hfPromise,
    ]);

    const allHits = algoliaResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

    const seen = new Set();
    const processedCommunity = allHits
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
        const publisher = resolvePublisher(link);

        return {
          id: `story-${h.objectID}`,
          title,
          link,
          source: publisher,
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
      });

    // Filter HF papers if a specific topic was selected
    const filteredHFPapers = hfPapers.filter((p) => {
      if (topic === "all") return true;
      return p.pillar === topic;
    });

    const combined = [...processedCommunity, ...filteredHFPapers]
      .filter((item) => {
        // Topic filter if specific
        if (topic !== "all" && item.pillar !== topic) return false;
        return true;
      })
      .sort((a, b) => b.points - a.points); // Rank strictly by upvotes!

    topCache.set(cacheKey, { timestamp: nowMs, data: combined });
    return combined;
  } catch (err) {
    console.error("fetchTopStories error:", err.message);
    return [];
  }
}
