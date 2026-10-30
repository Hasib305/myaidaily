// lib/nlp.js
// Clean, Zero-Token NLP Extractor & Classifier
// Extracts concise 2-sentence technical takeaways without calling external LLMs ($0 cost, 0 tokens).

const PILLAR_KEYWORDS = {
  "models-reasoning": [
    "reasoning",
    "deepseek",
    "o1",
    "o3",
    "cot",
    "chain-of-thought",
    "rlvr",
    "grpo",
    "ppo",
    "reinforcement learning",
    "test-time compute",
    "mla",
    "latent attention",
    "moe",
    "mixture of experts",
    "foundation model",
    "llama",
    "qwen",
    "gemma",
    "mistral",
    "phi-4",
    "slm",
    "multimodal",
    "vision-language",
    "audio",
  ],
  "agents-mcp": [
    "mcp",
    "model context protocol",
    "agent",
    "agents",
    "agentic",
    "swarm",
    "langgraph",
    "autogen",
    "crewai",
    "tool calling",
    "function calling",
    "computer use",
    "browser-use",
    "autonomous",
    "workflow",
  ],
  "knowledge-retrieval": [
    "rag",
    "kag",
    "graphrag",
    "retrieval",
    "vector",
    "embedding",
    "embeddings",
    "rerank",
    "chunking",
    "knowledge graph",
    "openspg",
    "pinecone",
    "qdrant",
    "weaviate",
    "milvus",
    "pgvector",
    "hybrid search",
  ],
  "infra-serving": [
    "vllm",
    "sglang",
    "tensorrt",
    "inference",
    "pagedattention",
    "radixattention",
    "quantization",
    "quantized",
    "awq",
    "gguf",
    "llama.cpp",
    "fp8",
    "speculative decoding",
    "kv cache",
    "triton",
    "cuda",
    "gpu",
    "bitnet",
    "ollama",
  ],
  "devtools-coding": [
    "cursor",
    "windsurf",
    "copilot",
    "claude code",
    "claude",
    "vscode",
    "vs code",
    "extension",
    "backdoor",
    "vulnerability",
    "security",
    "dspy",
    "eval",
    "evaluation",
    "ragas",
    "deepeval",
    "synthetic data",
    "unsloth",
    "lora",
    "fine-tuning",
    "prompt engineering",
    "context engineering",
  ],
  "research-papers": [
    "arxiv",
    "paper",
    "benchmark",
    "ablation",
    "theorem",
    "dataset",
    "survey",
    "mathematical",
    "framework",
  ],
};

// Clean plain text metadata (no emojis, no neon badges)
const PILLAR_META = {
  "models-reasoning": { label: "Models & Reasoning" },
  "agents-mcp": { label: "Agents & Tools" },
  "knowledge-retrieval": { label: "Retrieval & RAG" },
  "infra-serving": { label: "Inference & Serving" },
  "devtools-coding": { label: "Developer Tools" },
  "research-papers": { label: "Research & Papers" },
};

const TAG_DICTIONARY = [
  { tag: "KAG", pattern: /\b(kag|knowledge[- ]augmented generation)\b/i },
  { tag: "RAG", pattern: /\b(rag|retrieval[- ]augmented generation)\b/i },
  { tag: "GraphRAG", pattern: /\bgraphrag\b/i },
  { tag: "MCP", pattern: /\b(mcp|model context protocol)\b/i },
  { tag: "DeepSeek", pattern: /\bdeepseek(-?r1|-?v3)?\b/i },
  { tag: "Reasoning", pattern: /\b(reasoning|test[- ]time compute|cot|chain[- ]of[- ]thought)\b/i },
  { tag: "GRPO", pattern: /\bgrpo\b/i },
  { tag: "RLVR", pattern: /\brlvr\b/i },
  { tag: "MLA", pattern: /\b(mla|multi[- ]head latent attention)\b/i },
  { tag: "vLLM", pattern: /\bvllm\b/i },
  { tag: "SGLang", pattern: /\bsglang\b/i },
  { tag: "Agents", pattern: /\b(agent|agents|agentic|swarm|langgraph)\b/i },
  { tag: "SLM", pattern: /\b(slm|small language model|llama 3\.2|phi[- ]?4|gemma 2)\b/i },
  { tag: "Quantization", pattern: /\b(quantization|awq|gguf|fp8|int4|bitnet)\b/i },
  { tag: "FineTuning", pattern: /\b(fine[- ]tuning|lora|qlora|dpo|unsloth)\b/i },
  { tag: "Claude", pattern: /\b(claude|anthropic)\b/i },
  { tag: "Security", pattern: /\b(vulnerability|backdoor|exploit|compromised|malware|breach|security)\b/i },
  { tag: "CodingAI", pattern: /\b(cursor|windsurf|copilot|claude code|vscode|vs code|coding agent)\b/i },
  { tag: "Multimodal", pattern: /\b(multimodal|vision|audio|omni|speech|video generation)\b/i },
  { tag: "OpenSource", pattern: /\b(open source|open weights|weights released|hugging face)\b/i },
];

/**
 * Heuristic Extractive Summarizer
 * Extracts the 2 most informative technical sentences in clean plain text.
 */
export function extractTechnicalSummary(rawText, title = "") {
  if (!rawText) return title || "No summary available.";

  const clean = rawText
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)/g) || [clean];

  const highSignalRegex =
    /\b(we propose|we introduce|presents?|demonstrates?|outperforms?|achieves?|reduces?|enables?|architecture|framework|standard|open-source|released|benchmark|speedup|accuracy|efficiency|evaluated|replaces?|improves?)\b/i;

  const chosen = [];
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length < 25 || trimmed.length > 260) continue;
    if (/\b(subscribe|sign up|click here|cookie|all rights reserved|comments?|submitted by)\b/i.test(trimmed)) continue;

    if (highSignalRegex.test(trimmed)) {
      chosen.push(trimmed);
      if (chosen.length >= 2) break;
    }
  }

  if (chosen.length === 0) {
    const candidates = sentences
      .map((s) => s.trim())
      .filter((s) => s.length >= 30 && !/\b(subscribe|sign up|cookie)\b/i.test(s));
    return candidates.slice(0, 2).join(" ") || clean.slice(0, 220) + "...";
  }

  return chosen.join(" ");
}

/**
 * Classify article into one of the 6 engineering pillars
 */
export function classifyPillar(title = "", text = "") {
  const combined = (title + " " + text).toLowerCase();

  let maxScore = 0;
  let bestPillar = "research-papers";

  for (const [pillar, keywords] of Object.entries(PILLAR_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
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
    label: PILLAR_META[bestPillar]?.label || "Research & Papers",
  };
}

/**
 * Clean Tag Extraction
 */
export function extractTags(title = "", text = "") {
  const combined = title + " " + text;
  const tags = new Set();

  for (const item of TAG_DICTIONARY) {
    if (item.pattern.test(combined)) {
      tags.add(item.tag);
    }
  }

  if (tags.size === 0) {
    if (/paper|arxiv/i.test(combined)) tags.add("Research");
    else tags.add("Engineering");
  }

  return Array.from(tags).slice(0, 3);
}

/**
 * Calculate Engineering Relevance Score (1 - 10)
 */
export function calculateRelevance(title = "", text = "", date = Date.now()) {
  const combined = (title + " " + text).toLowerCase();
  let score = 5;

  if (/\b(deepseek|o1|o3|mcp|kag|vllm|sglang|grpo|mla)\b/i.test(combined)) score += 3;
  if (/\b(benchmark|outperforms|state-of-the-art|sota|open source|code release)\b/i.test(combined)) score += 2;
  if (/\b(how to build|tutorial|production|infrastructure|serving|architecture)\b/i.test(combined)) score += 1;

  const ageHours = (Date.now() - date) / (1000 * 60 * 60);
  if (ageHours < 24) score += 1;

  if (/\b(crypto|nft|celebrity|lawsuit|stock price|valuation)\b/i.test(combined)) score -= 3;

  return Math.min(10, Math.max(1, score));
}
