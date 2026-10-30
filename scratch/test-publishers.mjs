function resolvePublisher(url) {
  if (!url) return "Community";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("arxiv.org")) return "arXiv";
    if (host.includes("github.com")) return "GitHub";
    if (host.includes("huggingface.co")) return "Hugging Face";
    if (host.includes("anthropic.com")) return "Anthropic";
    if (host.includes("openai.com")) return "OpenAI";
    if (host.includes("google.com") || host.includes("deepmind.google")) return "Google AI";
    if (host.includes("thehackernews.com")) return "The Hacker News";
    if (host.includes("theverge.com")) return "The Verge";
    if (host.includes("simonwillison.net")) return "Simon Willison";
    if (host.includes("latent.space")) return "Latent Space";
    if (host.includes("ycombinator.com")) return "Community Discussion";
    return host;
  } catch {
    return "Community";
  }
}

async function testSources() {
  const hnUrl = "https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=10";
  const r = await fetch(hnUrl);
  const d = await r.json();
  console.log("Resolved sources from Top stories:");
  d.hits.forEach(h => {
    console.log(` - Source: [${resolvePublisher(h.url)}] | Points: ${h.points} | Title: ${h.title.slice(0, 45)}`);
  });
}

testSources();
