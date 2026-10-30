import { getNews } from "../lib/feeds.js";

async function run() {
  console.log("Fetching live news feeds...");
  const data = await getNews(true);
  console.log("Stats:", data.stats);
  console.log("Total live items:", data.items.length);

  const pillars = {};
  data.items.forEach((i) => {
    pillars[i.pillar] = (pillars[i.pillar] || 0) + 1;
  });
  console.log("Pillars:", pillars);

  if (data.items.length > 0) {
    const s = data.items[0];
    console.log("\nSample Live Article:");
    console.log("Title:", s.title);
    console.log("Source:", s.source);
    console.log("Date:", new Date(s.date).toISOString());
    console.log("Pillar:", s.pillar, `(${s.pillarLabel})`);
    console.log("Tags:", s.tags);
    console.log("Summary:", s.summary);
  }
}

run().catch(console.error);
