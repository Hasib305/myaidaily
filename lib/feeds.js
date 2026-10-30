import Parser from "rss-parser";

// Add/remove sources freely
export const SOURCES = [
  { name: "arXiv cs.AI", url: "https://rss.arxiv.org/rss/cs.AI" },
  { name: "arXiv cs.CL", url: "https://rss.arxiv.org/rss/cs.CL" },
  { name: "HN: AI", url: "https://hnrss.org/newest?q=LLM+OR+RAG+OR+agents+OR+%22AI+model%22&points=40" },
  { name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml" },
  { name: "OpenAI", url: "https://openai.com/news/rss.xml" },
  { name: "Google AI", url: "https://blog.google/technology/ai/rss/" },
  { name: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
  { name: "Latent Space", url: "https://www.latent.space/feed" },
  { name: "MarkTechPost", url: "https://www.marktechpost.com/feed/" },
  { name: "r/LocalLLaMA", url: "https://www.reddit.com/r/LocalLLaMA/top/.rss?t=day" },
  { name: "r/MachineLearning", url: "https://www.reddit.com/r/MachineLearning/top/.rss?t=day" },
];

const parser = new Parser();
const clean = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function load(src) {
  try {
    const r = await fetch(src.url, {
      headers: { "User-Agent": "ai-pulse/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    const feed = await parser.parseString(await r.text());
    return feed.items.slice(0, 8).map((i) => ({
      title: clean(i.title),
      link: i.link,
      source: src.name,
      date: new Date(i.isoDate || i.pubDate || Date.now()).getTime(),
      text: clean(i.contentSnippet || i.content || i.summary || "").slice(0, 600),
    }));
  } catch {
    return [];
  }
}

async function summarize(items) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return items.map((i) => ({ ...i, summary: i.text.slice(0, 200), tags: [] }));
  try {
    const input = items.map((x, i) => `${i}|${x.title}|${x.text.slice(0, 350)}`).join("\n");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.SUMMARY_MODEL || "claude-haiku-5-5",
        max_tokens: 4000,
        system:
          'For each line "id|title|text" return ONLY a JSON array of {"i":id,"s":"one-sentence summary (max 30 words) focused on what is new/technical","t":["1-3 short tags e.g. RAG, KAG, agents, MCP, inference, model release"],"k":0-10 relevance for an AI engineer}. Drop nothing.',
        messages: [{ role: "user", content: input }],
      }),
    });
    const data = await r.json();
    const arr = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
    const map = Object.fromEntries(arr.map((a) => [a.i, a]));
    return items.map((x, i) => ({
      ...x,
      summary: map[i]?.s || x.text.slice(0, 200),
      tags: map[i]?.t || [],
      score: map[i]?.k ?? 5,
    }));
  } catch {
    return items.map((i) => ({ ...i, summary: i.text.slice(0, 200), tags: [] }));
  }
}

export async function getNews() {
  const all = (await Promise.all(SOURCES.map(load))).flat();
  const seen = new Set();
  const items = all
    .filter((i) => i.title && i.link && !seen.has(i.link) && seen.add(i.link))
    .sort((a, b) => b.date - a.date)
    .slice(0, 40);
  const out = await summarize(items);
  return out.filter((i) => (i.score ?? 5) >= 4);
}
