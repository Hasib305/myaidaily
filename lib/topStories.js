// lib/topStories.js
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

const topCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchHFPapers() {
  try {
    const res = await fetch("https://huggingface.co/api/daily_papers", {
      headers: { "User-Agent": "MyAIDailyBot/2.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        const p = item.paper || item;
        const title = cleanText(p.title || item.title || "");
        const rawText = cleanText(p.summary || item.summary || title);
        const pubDate = new Date(p.publishedAt || item.publishedAt || Date.now()).getTime();

        const score = calculateRelevance(title, rawText, pubDate);
        if (score < 6) return null;

        const summary = extractTechnicalSummary(rawText, title);
        const pillarInfo = classifyPillar(title, rawText);
        const tags = extractTags(title, rawText);
        const threeBullets = generateThreeBulletSummary(title, rawText, tags);
        const badges = computeBadges(pubDate, p.upvotes || 0, score);

        return {
          id: `hf-${p.id || title.slice(0, 30)}`,
          title,
          link: `https://huggingface.co/papers/${p.id}`,
          source: "Hugging Face Papers",
          sourceCategory: "research",
          date: pubDate,
          summary,
          threeBullets,
          pillar: pillarInfo.pillar,
          pillarLabel: pillarInfo.label,
          tags,
          score,
          points: p.upvotes || 0,
          isNew: badges.isNew,
          isRising: badges.isRising,
        };
      })
      .filter(Boolean);
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

    const hfPromise = fetchHFPapers();

    const [algoliaResults, hfPapers] = await Promise.all([
      Promise.allSettled(algoliaPromises),
      hfPromise,
    ]);

    const allHits = algoliaResults.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

    const seen = new Set();
    const processedCommunity = [];

    for (const h of allHits) {
      if (!h.title || seen.has(h.objectID)) continue;
      seen.add(h.objectID);

      const title = cleanText(h.title);
      const link = h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`;
      const rawText = cleanText(h.story_text || title);
      const pubDate = (h.created_at_i || Math.floor(Date.now() / 1000)) * 1000;

      const score = calculateRelevance(title, rawText, pubDate);
      if (score < 6) continue; // Strict quality gate

      const summary = extractTechnicalSummary(rawText, title);
      const pillarInfo = classifyPillar(title, rawText);
      const tags = extractTags(title, rawText);
      const threeBullets = generateThreeBulletSummary(title, rawText, tags);
      const badges = computeBadges(pubDate, h.points || 0, score);
      const publisher = resolvePublisher(link);

      processedCommunity.push({
        id: `story-${h.objectID}`,
        title,
        link,
        source: publisher,
        sourceCategory: "top-community",
        date: pubDate,
        summary,
        threeBullets,
        pillar: pillarInfo.pillar,
        pillarLabel: pillarInfo.label,
        tags,
        score,
        points: h.points || 0,
        commentsCount: h.num_comments || 0,
        hnUrl: `https://news.ycombinator.com/item?id=${h.objectID}`,
        isNew: badges.isNew,
        isRising: badges.isRising,
      });
    }

    const filteredHFPapers = hfPapers.filter((p) => {
      if (topic === "all") return true;
      return p.pillar === topic;
    });

    const merged = [...processedCommunity, ...filteredHFPapers]
      .filter((item) => {
        if (topic !== "all" && item.pillar !== topic) return false;
        return true;
      })
      .sort((a, b) => b.points - a.points);

    // Group duplicates
    const clustered = clusterDuplicates(merged);

    topCache.set(cacheKey, { timestamp: nowMs, data: clustered });
    return clustered;
  } catch (err) {
    console.error("fetchTopStories error:", err.message);
    return [];
  }
}
