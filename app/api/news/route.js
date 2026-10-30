import { getNews } from "../../../lib/feeds.js";
import { fetchTopStories } from "../../../lib/topStories.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "live";
    const forceRefresh = searchParams.get("refresh") === "true";

    if (mode === "top") {
      const timeframe = searchParams.get("timeframe") || "month";
      const topic = searchParams.get("topic") || "all";
      const items = await fetchTopStories({ timeframe, topic });
      return NextResponse.json({
        mode: "top",
        timeframe,
        topic,
        items,
        total: items.length,
      });
    }

    // Default: live news feeds
    const data = await getNews(forceRefresh);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch news data", message: error.message },
      { status: 500 }
    );
  }
}
