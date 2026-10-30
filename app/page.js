import { getNews } from "../lib/feeds";
import Feed from "./Feed";

export const revalidate = 3600; // rebuild hourly

export default async function Home() {
  const items = await getNews();
  return (
    <main>
      <header>
        <h1>AI Pulse</h1>
        <p>Updated {new Date().toUTCString()} · {items.length} items</p>
      </header>
      <Feed items={items} />
    </main>
  );
}
