const TOPIC_TERMS = {
  all: ["AI", "LLM", "DeepSeek", "Claude"],
  "models-reasoning": ["DeepSeek", "reasoning", "LLM", "o1"],
  "agents-mcp": ["agent", "MCP", "Cursor"],
  "knowledge-retrieval": ["RAG", "KAG", "vector"],
  "infra-serving": ["vLLM", "quantization", "SGLang", "inference"],
  "devtools-coding": ["Cursor", "Claude", "copilot"],
  "research-papers": ["arxiv", "paper", "benchmark"],
};

async function fetchTopic(timeframe = "week", topic = "all") {
  const now = Math.floor(Date.now() / 1000);
  const durations = {
    week: 7 * 86400,
    month: 30 * 86400,
    six_months: 180 * 86400,
    year: 365 * 86400,
  };
  const timeStart = now - (durations[timeframe] || durations.month);
  const minPoints = (timeframe === "week" || timeframe === "month") ? 20 : 40;

  const terms = TOPIC_TERMS[topic] || TOPIC_TERMS.all;

  const results = await Promise.all(
    terms.map(async (term) => {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(term)}&tags=story&numericFilters=${encodeURIComponent(`created_at_i>${timeStart},points>${minPoints}`)}&hitsPerPage=20`;
      const res = await fetch(url);
      const data = await res.json();
      return data.hits || [];
    })
  );

  const seen = new Set();
  const merged = results.flat().filter((h) => {
    if (!h.title || seen.has(h.objectID)) return false;
    seen.add(h.objectID);
    return true;
  });

  merged.sort((a, b) => b.points - a.points);
  console.log(`=== ${timeframe} | ${topic} => ${merged.length} stories ===`);
  merged.slice(0, 3).forEach((h) => {
    console.log(`   ▲ ${h.points} pts | ${h.title}`);
  });
}

async function run() {
  await fetchTopic("week", "all");
  await fetchTopic("week", "models-reasoning");
  await fetchTopic("week", "agents-mcp");
  await fetchTopic("month", "knowledge-retrieval");
  await fetchTopic("six_months", "all");
  await fetchTopic("year", "infra-serving");
}

run();
