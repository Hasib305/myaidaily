import { getNews } from "../lib/feeds";
import Feed from "./Feed";

export const revalidate = 3600; // Hourly Incremental Static Regeneration on Vercel

export const metadata = {
  title: "AI Pulse · AI Engineer's Daily Intelligence Wire",
  description:
    "Zero-token daily updates on emerging AI technology: KAG, RAG, MCP, Reasoning models, vLLM, SGLang, and recent architectural paradigm shifts.",
};

export default async function Home() {
  const initialData = await getNews();
  return <Feed initialData={initialData} />;
}
