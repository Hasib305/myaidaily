"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import NewsCard from "./components/NewsCard";
import { X, Check, Flame, Trophy, Sparkles } from "lucide-react";

const TOPICS = [
  { id: "all", label: "All Topics" },
  { id: "models-reasoning", label: "Models & Reasoning" },
  { id: "agents-mcp", label: "Agents & Tools" },
  { id: "knowledge-retrieval", label: "Retrieval & RAG" },
  { id: "infra-serving", label: "Inference & Serving" },
  { id: "devtools-coding", label: "Developer Tools" },
  { id: "research-papers", label: "Research & Papers" },
];

const TIME_HORIZONS = [
  { id: "live", label: "Live Today (24h)", badge: "Live" },
  { id: "week", label: "Top of the Week", isTop: true },
  { id: "month", label: "Top of the Month", isTop: true },
  { id: "six_months", label: "Top 6 Months", isTop: true },
  { id: "year", label: "Top of the Year", isTop: true },
];

export default function Feed({ initialData }) {
  // Live Data State
  const [liveItems, setLiveItems] = useState(initialData?.items || []);
  const [stats, setStats] = useState(initialData?.stats || {});
  const [lastUpdated, setLastUpdated] = useState(initialData?.stats?.updatedAt || new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(false);

  // Top Stories State (Week, Month, 6 Months, Year)
  const [topItems, setTopItems] = useState([]);
  const [isLoadingTop, setIsLoadingTop] = useState(false);

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("live"); // 'live' | 'week' | 'month' | 'six_months' | 'year' | 'bookmarks'
  const [activeTopic, setActiveTopic] = useState("all");
  const [activeTag, setActiveTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'relevance'
  const [bookmarks, setBookmarks] = useState([]);
  const [isDark, setIsDark] = useState(false);

  // Load saved bookmarks and theme from localStorage
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("myaidaily_bookmarks") || localStorage.getItem("aipulse_bookmarks");
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedTheme = localStorage.getItem("myaidaily_theme") || localStorage.getItem("aipulse_theme");
      if (savedTheme) {
        setIsDark(savedTheme === "dark");
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }
    } catch {}

    const handleKeyDown = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]');
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch top stories when timeframe (week/month/six_months/year) or topic changes
  const loadTopStories = useCallback(async (timeframe, topic) => {
    setIsLoadingTop(true);
    try {
      const res = await fetch(`/api/news?mode=top&timeframe=${timeframe}&topic=${topic}`);
      if (res.ok) {
        const json = await res.json();
        setTopItems(json.items || []);
      }
    } catch (err) {
      console.error("Failed to load top stories:", err);
    } finally {
      setIsLoadingTop(false);
    }
  }, []);

  // Handle switching time horizon
  const handleSelectTimeHorizon = (horizonId) => {
    setTimeHorizon(horizonId);
    if (["week", "month", "six_months", "year"].includes(horizonId)) {
      setSortBy("top");
      loadTopStories(horizonId, activeTopic);
    } else {
      setSortBy("newest");
    }
  };

  // Handle switching topic
  const handleSelectTopic = (topicId) => {
    setActiveTopic(topicId);
    if (["week", "month", "six_months", "year"].includes(timeHorizon)) {
      loadTopStories(timeHorizon, topicId);
    }
  };

  // Live Refresh handler
  const handleLiveRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (["week", "month", "six_months", "year"].includes(timeHorizon)) {
        await loadTopStories(timeHorizon, activeTopic);
      } else {
        const res = await fetch("/api/news?refresh=true");
        if (res.ok) {
          const fresh = await res.json();
          if (fresh.items && fresh.items.length > 0) {
            setLiveItems(fresh.items);
            setStats(fresh.stats);
            setLastUpdated(fresh.stats.updatedAt);
            setRefreshNotice(true);
            setTimeout(() => setRefreshNotice(false), 3000);
          }
        }
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("myaidaily_theme", nextDark ? "dark" : "light");
    } catch {}
  };

  const toggleBookmark = (item) => {
    let next;
    const exists = bookmarks.some((b) => b.id === item.id);
    if (exists) {
      next = bookmarks.filter((b) => b.id !== item.id);
    } else {
      next = [item, ...bookmarks];
    }
    setBookmarks(next);
    try {
      localStorage.setItem("myaidaily_bookmarks", JSON.stringify(next));
    } catch {}
  };

  // Determine current displayed list
  const currentSourceList = useMemo(() => {
    if (timeHorizon === "bookmarks") return bookmarks;
    if (["week", "month", "six_months", "year"].includes(timeHorizon)) {
      return topItems;
    }
    // 'live'
    return liveItems;
  }, [timeHorizon, bookmarks, topItems, liveItems]);

  // Filtered stories
  const filteredItems = useMemo(() => {
    let list = currentSourceList;

    if (timeHorizon === "live" && activeTopic !== "all") {
      list = list.filter((i) => i.pillar === activeTopic);
    }

    if (activeTag) {
      list = list.filter((i) => i.tags?.includes(activeTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.summary?.toLowerCase().includes(q) ||
          i.source?.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    const isTopHorizon = ["week", "month", "six_months", "year"].includes(timeHorizon);
    const sorted = [...list];

    if (sortBy === "top" || (isTopHorizon && sortBy !== "newest")) {
      sorted.sort((a, b) => (b.points || 0) - (a.points || 0) || (b.score || 0) - (a.score || 0) || b.date - a.date);
    } else if (sortBy === "newest") {
      sorted.sort((a, b) => b.date - a.date);
    } else if (sortBy === "relevance") {
      sorted.sort((a, b) => (b.points || b.score || 0) - (a.points || a.score || 0) || b.date - a.date);
    }

    return sorted;
  }, [currentSourceList, timeHorizon, activeTopic, activeTag, searchQuery, sortBy]);

  const resetFilters = () => {
    setActiveTopic("all");
    setActiveTag("");
    setSearchQuery("");
  };

  const hasActiveFilters = activeTopic !== "all" || activeTag || searchQuery.trim();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      {/* Top Clean Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bookmarksCount={bookmarks.length}
        activeTab={timeHorizon}
        onSelectTab={(tab) => handleSelectTimeHorizon(tab)}
        isRefreshing={isRefreshing || isLoadingTop}
        onRefresh={handleLiveRefresh}
        lastUpdated={lastUpdated}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Live Refresh Notification Banner */}
        {refreshNotice && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              Live news feed refreshed successfully! ({liveItems.length} total articles)
            </span>
            <button onClick={() => setRefreshNotice(false)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Clean Filter Bar */}
        <div className="mb-6 space-y-3">
          {/* Row 1: Time Horizon Tabs (Week, Month, 6 Months, Year) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Live Today */}
              <button
                onClick={() => handleSelectTimeHorizon("live")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  timeHorizon === "live"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Today</span>
                <span className="text-[10px] opacity-75 font-mono">({stats.todayCount || liveItems.length})</span>
              </button>

              {/* Top of Week */}
              <button
                onClick={() => handleSelectTimeHorizon("week")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  timeHorizon === "week"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Top of Week</span>
              </button>

              {/* Top of Month */}
              <button
                onClick={() => handleSelectTimeHorizon("month")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  timeHorizon === "month"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Top of Month</span>
              </button>

              {/* Top 6 Months */}
              <button
                onClick={() => handleSelectTimeHorizon("six_months")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  timeHorizon === "six_months"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="font-semibold">Top 6 Months</span>
              </button>

              {/* Top of the Year */}
              <button
                onClick={() => handleSelectTimeHorizon("year")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  timeHorizon === "year"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="font-semibold">Top of Year</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-dim)]">
              <span>Sort:</span>
              <select
                value={["week", "month", "six_months", "year"].includes(timeHorizon) && sortBy !== "newest" ? "top" : sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] px-2 py-1 rounded text-xs focus:outline-none"
              >
                {["week", "month", "six_months", "year"].includes(timeHorizon) ? (
                  <>
                    <option value="top">▲ Most Upvoted (Top Rated)</option>
                    <option value="newest">Newest First</option>
                  </>
                ) : (
                  <>
                    <option value="newest">Newest First</option>
                    <option value="relevance">Highest Technical Relevance</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Row 2: Topic Selector (Per-topic filtering across week/month/6m/year) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTopic(t.id)}
                className={`whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${
                  activeTopic === t.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-medium"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border)] hover:text-[var(--fg)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-[var(--fg-dim)]">Filtered by:</span>
              {activeTopic !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)]">
                  Topic: {TOPICS.find((t) => t.id === activeTopic)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleSelectTopic("all")} />
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)]">
                  #{activeTag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveTag("")} />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)]">
                  "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </span>
              )}
              <button onClick={resetFilters} className="text-blue-600 hover:underline text-xs ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {isLoadingTop ? (
          <div className="text-center py-20 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-[var(--fg-muted)]">
              Fetching community-ranked breakthroughs for {TOPICS.find((t) => t.id === activeTopic)?.label}...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">No matching articles found</h3>
            <p className="text-xs text-[var(--fg-dim)] max-w-sm mx-auto mb-4">
              Try clearing your search query or switching to another topic or timeframe.
            </p>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              Show Live Today
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                isBookmarked={bookmarks.some((b) => b.id === item.id)}
                onToggleBookmark={toggleBookmark}
                onSelectTag={(t) => setActiveTag(t === activeTag ? "" : t)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border)] bg-[var(--bg-subtle)] py-6 text-xs text-[var(--fg-dim)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            MyAIDaily · Free AI Intelligence Wire (Live RSS + Community Ranked Top of Week, Month, 6 Months & Year)
          </div>
          <div className="font-mono text-[11px]">
            100% Free & Open · Zero Token Cost · Edge Cached on Vercel
          </div>
        </div>
      </footer>
    </div>
  );
}
