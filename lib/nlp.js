// lib/nlp.js
// Editorial-Grade Zero-Token NLP, Entity Decoder & Relevance Scorer
// Ensures 100% clean summaries, strict >= 6/10 relevance filter, and 3-bullet deep dives.

// 1. Comprehensive HTML Entity Decoding & URL/Garbage Stripping
export function cleanText(str = "") {
  if (!str) return "";

  return str
    // Common HTML entities & hexadecimal escapes
    .replace(/&#x2F;/gi, "/")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#8212;/gi, "—")
    .replace(/&#8211;/gi, "–")
    .replace(/&bull;/gi, "•")
    .replace(/&hellip;/gi, "...")
    .replace(/&nbsp;/gi, " ")
    .replace(/&copy;/gi, "")
    // Strip raw HTML tags
    .replace(/<[^>]+>/g, " ")
    // Strip raw markdown image and link syntax: [text](url) -> text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Strip standalone http/https URLs
    .replace(/https?:\/\/\S+/gi, "")
    // Strip boilerplate and submitter traces
    .replace(/\b(submitted by|comments?|read more|all rights reserved|sign up|subscribe)\b/gi, "")
    // Normalize spaces
    .replace(/\s+/g, " ")
    .trim();
}

// 2. Strict AI / Software Engineering Keywords
const NON_AI_PENALTY_TERMS = [
  "israel", "gaza", "hamas", "ukraine", "russia", "military strike", "airstrike",
  "homicide", "murder", "shooting", "stabbing", "car crash",
  "tax return", "irs refund", "ipad case", "celebrity gossip", "divorce",
  "presidential campaign", "ballot", "election poll", "nfl draft", "nba",
];

const AI_CORE_TERMS = [
  "llm", "large language model", "slm", "small language model", "foundation model",
  "reasoning model", "deepseek", "openai", "anthropic", "claude", "gemini", "llama",
  "qwen", "mistral", "gemma", "phi-4", "rag", "kag", "graphrag", "retrieval",
  "vector database", "embedding", "rerank", "chunking", "mcp", "model context protocol",
  "agent", "agents", "agentic", "tool calling", "function calling", "langgraph",
  "cursor", "windsurf", "coding agent", "copilot", "vllm", "sglang", "inference engine",
  "quantization", "awq", "gguf", "fp8", "speculative decoding", "pagedattention",
  "radixattention", "grpo", "rlvr", "reinforcement learning", "fine-tuning", "lora",
  "qlora", "dpo", "unsloth", "benchmark", "eval", "evaluation", "arxiv", "backdoor",
  "vulnerability", "prompt injection", "token limit", "kv cache",
];

// 3. Relevance Scorer (Strictly 1 to 10)
export function calculateRelevance(title = "", rawText = "", date = Date.now()) {
  const combined = (title + " " + rawText).toLowerCase();

  // Immediate penalty for non-tech / non-AI news
  for (const term of NON_AI_PENALTY_TERMS) {
    if (combined.includes(term)) {
      return 2; // Strict rejection
    }
  }

  let score = 5;
  let matches = 0;

  for (const term of AI_CORE_TERMS) {
    if (title.toLowerCase().includes(term)) {
      matches += 2;
    } else if (combined.includes(term)) {
      matches += 1;
    }
  }

  if (matches >= 4) score = 9;
  else if (matches >= 2) score = 7;
  else if (matches >= 1) score = 6;
  else score = 4;

  // Recency boost (within 24 hours)
  const ageHours = (Date.now() - date) / (1000 * 60 * 60);
  if (ageHours < 24 && score >= 6) score = Math.min(10, score + 1);

  return score;
}

// 4. Topic Categorization (6 Crisp Pillars)
const PILLAR_DEFINITIONS = {
  "models-reasoning": {
    label: "Models & Reasoning",
    keywords: ["deepseek", "o1", "o3", "reasoning", "cot", "grpo", "rlvr", "llama", "qwen", "gemma", "mistral", "phi", "slm", "multimodal", "vision", "audio", "voice", "foundation model"],
  },
  "agents-mcp": {
    label: "Agents & Tools",
    keywords: ["mcp", "model context protocol", "agent", "agents", "agentic", "swarm", "langgraph", "autogen", "tool calling", "function calling", "computer use", "browser-use"],
  },
  "knowledge-retrieval": {
    label: "Retrieval & RAG",
    keywords: ["rag", "kag", "graphrag", "retrieval", "vector", "embedding", "embeddings", "rerank", "knowledge graph", "openspg", "pinecone", "qdrant", "weaviate", "milvus", "hybrid search"],
  },
  "infra-serving": {
    label: "Inference & Serving",
    keywords: ["vllm", "sglang", "tensorrt", "inference", "quantization", "awq", "gguf", "llama.cpp", "fp8", "pagedattention", "radixattention", "speculative decoding", "kv cache", "triton", "cuda"],
  },
  "devtools-coding": {
    label: "Developer Tools",
    keywords: ["cursor", "windsurf", "claude code", "copilot", "vscode", "eval", "evaluation", "ragas", "deepeval", "unsloth", "lora", "fine-tuning", "dspy", "backdoor", "vulnerability"],
  },
  "research-papers": {
    label: "Research & Papers",
    keywords: ["arxiv", "paper", "benchmark", "ablation", "theorem", "dataset", "survey", "empirical", "architecture"],
  },
};

export function classifyPillar(title = "", text = "") {
  const combined = (title + " " + text).toLowerCase();
  let maxScore = 0;
  let bestPillar = "models-reasoning";

  for (const [pillar, def] of Object.entries(PILLAR_DEFINITIONS)) {
    let score = 0;
    for (const kw of def.keywords) {
      if (title.toLowerCase().includes(kw)) score += 3;
      else if (combined.includes(kw)) score += 1;
    }
    if (score > maxScore) {
      maxScore = score;
      bestPillar = pillar;
    }
  }

  return {
    pillar: bestPillar,
    label: PILLAR_DEFINITIONS[bestPillar].label,
  };
}

// 5. Specific, Useful Technical Tags (No Vague "Engineering" Tag)
const TAG_MAP = [
  { tag: "RAG", pattern: /\b(rag|retrieval[- ]augmented generation)\b/i },
  { tag: "KAG", pattern: /\b(kag|knowledge[- ]augmented generation)\b/i },
  { tag: "GraphRAG", pattern: /\bgraphrag\b/i },
  { tag: "MCP", pattern: /\b(mcp|model context protocol)\b/i },
  { tag: "Agents", pattern: /\b(agent|agents|agentic|swarm|langgraph)\b/i },
  { tag: "Reasoning", pattern: /\b(reasoning|test[- ]time compute|cot|chain[- ]of[- ]thought)\b/i },
  { tag: "DeepSeek", pattern: /\bdeepseek(-?r1|-?v3|-?v4)?\b/i },
  { tag: "Claude", pattern: /\b(claude|anthropic)\b/i },
  { tag: "OpenAI", pattern: /\b(openai|chatgpt|gpt-4|gpt-5|o1|o3)\b/i },
  { tag: "Inference", pattern: /\b(vllm|sglang|inference engine|radixattention|pagedattention)\b/i },
  { tag: "Quantization", pattern: /\b(quantization|awq|gguf|fp8|int4|bitnet)\b/i },
  { tag: "Fine-tuning", pattern: /\b(fine[- ]tuning|lora|qlora|dpo|orpo|unsloth)\b/i },
  { tag: "Evals", pattern: /\b(eval|evaluation|benchmark|ragas|deepeval)\b/i },
  { tag: "Open-weights", pattern: /\b(open source|open weights|weights released|hugging face)\b/i },
  { tag: "Security", pattern: /\b(security|vulnerability|backdoor|exploit|compromised|malware|prompt injection)\b/i },
  { tag: "Multimodal", pattern: /\b(multimodal|vision|audio|omni|speech|video generation)\b/i },
  { tag: "SLMs", pattern: /\b(slm|small language model|llama 3\.2|phi[- ]?4|gemma 2)\b/i },
];

export function extractTags(title = "", text = "") {
  const combined = title + " " + text;
  const tags = new Set();

  for (const item of TAG_MAP) {
    if (item.pattern.test(combined)) {
      tags.add(item.tag);
    }
  }

  // Fallbacks: specific, never generic
  if (tags.size === 0) {
    if (/paper|arxiv/i.test(combined)) tags.add("Research");
    else if (/model|llm/i.test(combined)) tags.add("Models");
    else tags.add("DevTools");
  }

  return Array.from(tags).slice(0, 3);
}

// 6. Editorial "Why It Matters" Summary (Never repeats the title)
export function extractTechnicalSummary(rawText, title = "") {
  const clean = cleanText(rawText);
  if (!clean) return "Introduces technical architectural changes and benchmark evaluations for production systems.";

  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) || [clean];

  // Look for sentences expressing technical changes, results, or mechanisms
  const signalRegex = /\b(proposes?|introduces?|demonstrates?|outperforms?|achieves?|reduces?|enables?|architecture|framework|standard|open-source|released|benchmark|speedup|accuracy|efficiency|evaluated|replaces?|improves?|trained|designed)\b/i;

  const titleLower = title.toLowerCase().replace(/[^a-z0-9]/g, " ");

  const picked = [];
  for (const s of sentences) {
    const trimmed = cleanText(s);
    if (trimmed.length < 30 || trimmed.length > 250) continue;

    // Do not repeat title verbatim
    const sLower = trimmed.toLowerCase().replace(/[^a-z0-9]/g, " ");
    if (sLower === titleLower || titleLower.includes(sLower) || sLower.includes(titleLower)) continue;

    if (signalRegex.test(trimmed)) {
      picked.push(trimmed);
      if (picked.length >= 2) break;
    }
  }

  if (picked.length > 0) {
    return picked.join(" ");
  }

  // Fallback to first non-title sentence
  for (const s of sentences) {
    const trimmed = cleanText(s);
    if (trimmed.length >= 35 && !titleLower.includes(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  return clean.slice(0, 200) + "...";
}

// 7. Expand-in-place 3-Bullet Deep Dive Generator (What's new / Why it matters / Who should care)
export function generateThreeBulletSummary(title = "", rawText = "", tags = []) {
  const clean = cleanText(rawText);
  const titleClean = cleanText(title);

  // What's new
  let whatsNew = `${titleClean}.`;
  if (clean && clean.length > 30) {
    const firstSentence = clean.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 25 && firstSentence.length < 180) {
      whatsNew = cleanText(firstSentence) + ".";
    }
  }

  // Why it matters
  let whyItMatters = "Shifts implementation conventions, enabling higher inference throughput or more reliable multi-step agent execution.";
  if (tags.includes("KAG") || tags.includes("RAG")) {
    whyItMatters = "Directly improves retrieval precision by reducing vector hallucinations and integrating structured domain relational facts.";
  } else if (tags.includes("MCP")) {
    whyItMatters = "Standardizes external tool and database integration via JSON-RPC, removing the need for proprietary ad-hoc client wrappers.";
  } else if (tags.includes("DeepSeek") || tags.includes("Reasoning")) {
    whyItMatters = "Demonstrates frontier-grade reasoning through verifiable outcome reinforcement learning (RLVR/GRPO) at dramatically reduced training cost.";
  } else if (tags.includes("Inference") || tags.includes("Quantization")) {
    whyItMatters = "Cuts GPU memory overhead and token latency, enabling higher concurrent requests for production serving stacks.";
  } else if (tags.includes("Security")) {
    whyItMatters = "Exposes critical supply-chain attack vectors in agentic extensions and dev tooling requiring immediate verification.";
  }

  // Who should care
  let whoShouldCare = "Software engineers, AI platform architects, and LLM application developers.";
  if (tags.includes("Inference") || tags.includes("Quantization")) {
    whoShouldCare = "ML infrastructure engineers, GPU cluster operators, and systems programmers.";
  } else if (tags.includes("Security")) {
    whoShouldCare = "Application security teams, IDE extension developers, and DevSecOps leads.";
  } else if (tags.includes("Research") || tags.includes("Evals")) {
    whoShouldCare = "AI researchers, benchmark evaluators, and foundation model teams.";
  }

  return {
    whatsNew,
    whyItMatters,
    whoShouldCare,
  };
}

// 8. Badges: NEW (<3h) & Rising
export function computeBadges(date = Date.now(), points = 0, score = 5) {
  const ageMs = Date.now() - date;
  const isNew = ageMs <= 3 * 60 * 60 * 1000; // < 3 hours old
  const isRising = points >= 90 || score >= 9;

  return { isNew, isRising };
}

// 9. Group Duplicate Stories into One Card ("Also covered by X sources")
export function clusterDuplicates(items = []) {
  const clusters = [];
  const processed = new Set();

  for (let i = 0; i < items.length; i++) {
    if (processed.has(items[i].id)) continue;

    const current = { ...items[i], otherSources: [] };
    processed.add(items[i].id);

    // Normalize words for fuzzy similarity
    const wordsA = new Set(
      current.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
    );

    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(items[j].id)) continue;

      const wordsB = new Set(
        items[j].title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
      );

      // Count overlapping significant words
      let overlap = 0;
      for (const w of wordsA) {
        if (wordsB.has(w)) overlap++;
      }

      // If significant overlap (e.g. 4+ key terms or >= 65% overlap) and different sources
      const minLen = Math.min(wordsA.size, wordsB.size);
      if (minLen >= 3 && (overlap >= 4 || overlap / minLen >= 0.65)) {
        processed.add(items[j].id);
        current.otherSources.push({
          source: items[j].source,
          title: items[j].title,
          link: items[j].link,
          date: items[j].date,
          points: items[j].points || 0,
        });
      }
    }

    clusters.push(current);
  }

  return clusters;
}
