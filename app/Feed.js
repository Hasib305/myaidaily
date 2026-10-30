"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import CommandPalette from "./components/CommandPalette";
import DailyBriefing from "./components/DailyBriefing";
import HeroTopStory from "./components/HeroTopStory";
import TopRankedList from "./components/TopRankedList";
import NewsCard from "./components/NewsCard";
import Sidebar from "./components/Sidebar";
import { X, Trophy, Flame, Sparkles, Filter, Check } from "lucide-react";

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
  { id: "live", label: "Today" },
  { id: "week", label: "Top Week", isTop: true },
  { id: "month", label: "Top Month", isTop: true },
  { id: "six_months", label: "Top 6M", isTop: true },
  { id: "year", label: "Top Year", isTop: true },
];

export default function Feed({ initialData }) {
  // Live Data State
  const [liveItems, setLiveItems] = useState(initialData?.items || []);
  const [stats, setStats] = useState(initialData?.stats || {});
  const [dailyBriefing, setDailyBriefing] = useState(initialData?.dailyBriefing || []);
  const [trendingTags, setTrendingTags] = useState(initialData?.trendingTags || []);
  const [activeSources, setActiveSources] = useState(initialData?.activeSources || []);
  const [lastUpdated, setLastUpdated] = useState(initialData?.stats?.updatedAt || new Date().toISOString());

  // Top Stories State (Week, Month, 6M, Year)
  const [topItems, setTopItems] = useState([]);
  const [isLoadingTop, setIsLoadingTop] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(false);

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("live"); // 'live' | 'week' | 'month' | 'six_months' | 'year' | 'bookmarks'
  const [activeTopic, setActiveTopic] = useState("all");
  const [activeTag, setActiveTag] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'top' | 'newest' | 'relevance'
  const [bookmarks, setBookmarks] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [isDark, setIsDark] = useState(false);

  // Command palette & keyboard navigation
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(-1);

  // 1. Load saved bookmarks, theme & read tracking from localStorage
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("myaidaily_bookmarks") || localStorage.getItem("aipulse_bookmarks");
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedTheme = localStorage.getItem("myaidaily_theme") || localStorage.getItem("aipulse_theme");
      if (savedTheme) {
        setIsDark(savedTheme === "dark");
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      }

      const savedRead = localStorage.getItem("myaidaily_read");
      if (savedRead) {
        setReadIds(new Set(JSON.parse(savedRead)));
      }
    } catch {}
  }, []);

  // 2. Fetch top stories when timeframe or topic changes
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

  const handleSelectTimeHorizon = (horizonId) => {
    setTimeHorizon(horizonId);
    setSelectedStoryIndex(-1);
    if (["week", "month", "six_months", "year"].includes(horizonId)) {
      setSortBy("top");
      loadTopStories(horizonId, activeTopic);
    } else {
      setSortBy("newest");
    }
  };

  const handleSelectTopic = (topicId) => {
    setActiveTopic(topicId);
    setSelectedStoryIndex(-1);
    if (["week", "month", "six_months", "year"].includes(timeHorizon)) {
      loadTopStories(timeHorizon, topicId);
    }
  };

  // 3. Live refresh handler
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
            if (fresh.dailyBriefing) setDailyBriefing(fresh.dailyBriefing);
            if (fresh.trendingTags) setTrendingTags(fresh.trendingTags);
            if (fresh.activeSources) setActiveSources(fresh.activeSources);
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

  // 4. Bookmark and Read toggle helpers
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

  const markStoryAsRead = (id) => {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    try {
      localStorage.setItem("myaidaily_read", JSON.stringify(Array.from(next)));
    } catch {}
  };

  const markAllAsRead = () => {
    const next = new Set(readIds);
    filteredItems.forEach((i) => next.add(i.id));
    setReadIds(next);
    try {
      localStorage.setItem("myaidaily_read", JSON.stringify(Array.from(next)));
    } catch {}
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("myaidaily_theme", nextDark ? "dark" : "light");
    } catch {}
  };

  // 5. Filter & Sort pipeline
  const currentSourceList = useMemo(() => {
    if (timeHorizon === "bookmarks") return bookmarks;
    if (["week", "month", "six_months", "year"].includes(timeHorizon)) {
      return topItems;
    }
    return liveItems;
  }, [timeHorizon, bookmarks, topItems, liveItems]);

  const filteredItems = useMemo(() => {
    let list = currentSourceList;

    if (timeHorizon === "live" && activeTopic !== "all") {
      list = list.filter((i) => i.pillar === activeTopic);
    }

    if (activeTag) {
      list = list.filter((i) => i.tags?.includes(activeTag));
    }

    if (selectedSource) {
      list = list.filter((i) => i.source === selectedSource);
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
  }, [currentSourceList, timeHorizon, activeTopic, activeTag, selectedSource, searchQuery, sortBy]);

  // 6. Global keyboard shortcuts: j/k, s, o, ⌘K / /
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

      // ⌘K or / to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (e.key === "/" && !isCommandPaletteOpen) {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      if (filteredItems.length === 0) return;

      // j: Move down
      if (e.key === "j") {
        e.preventDefault();
        setSelectedStoryIndex((prev) => {
          const next = Math.min(filteredItems.length - 1, prev + 1);
          const el = document.getElementById(`story-${filteredItems[next]?.id}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      }

      // k: Move up
      if (e.key === "k") {
        e.preventDefault();
        setSelectedStoryIndex((prev) => {
          const next = Math.max(0, prev - 1);
          const el = document.getElementById(`story-${filteredItems[next]?.id}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          return next;
        });
      }

      // s: Save selected story
      if (e.key === "s" && selectedStoryIndex >= 0 && selectedStoryIndex < filteredItems.length) {
        e.preventDefault();
        toggleBookmark(filteredItems[selectedStoryIndex]);
      }

      // o: Open selected story
      if (e.key === "o" && selectedStoryIndex >= 0 && selectedStoryIndex < filteredItems.length) {
        e.preventDefault();
        const item = filteredItems[selectedStoryIndex];
        markStoryAsRead(item.id);
        window.open(item.link, "_blank", "noreferrer");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedStoryIndex, isCommandPaletteOpen]);

  const resetFilters = () => {
    setActiveTopic("all");
    setActiveTag("");
    setSelectedSource("");
    setSearchQuery("");
  };

  const hasActiveFilters = activeTopic !== "all" || activeTag || selectedSource || searchQuery.trim();

  // Partition stories for Editorial Hierarchy:
  // - topStory: highest score / first story
  // - top5Ranked: stories 1..5 for the ranked list
  // - feedStories: stories 6+ (or 1+ if not on Live)
  const isLiveView = timeHorizon === "live";
  const heroStory = isLiveView && filteredItems.length > 0 ? filteredItems[0] : null;
  const topRankedStories = isLiveView && filteredItems.length > 1 ? filteredItems.slice(1, 6) : [];
  const feedStories = isLiveView ? filteredItems.slice(6) : filteredItems;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--fg-primary)] transition-colors">
      {/* 1. Slim Sticky Header */}
      <Navbar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        bookmarksCount={bookmarks.length}
        activeTab={timeHorizon}
        onSelectTab={handleSelectTimeHorizon}
        isRefreshing={isRefreshing || isLoadingTop}
        onRefresh={handleLiveRefresh}
        lastUpdated={lastUpdated}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={currentSourceList}
        onSelectStory={(story) => {
          markStoryAsRead(story.id);
          window.open(story.link, "_blank", "noreferrer");
        }}
        onSelectTopic={handleSelectTopic}
      />

      {/* 2. Sticky Filter & Navigation Bar */}
      <nav className="sticky top-14 z-30 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-default)] transition-colors py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented Time Control */}
            <div className="inline-flex p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)]">
              {TIME_HORIZONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTimeHorizon(t.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-smooth ${
                    timeHorizon === t.id
                      ? "bg-[var(--bg-card)] text-[var(--fg-primary)] shadow-xs font-semibold"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={["week", "month", "six_months", "year"].includes(timeHorizon) && sortBy !== "newest" ? "top" : sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-primary)] px-2 py-1 rounded-md text-xs focus:outline-none"
              >
                {["week", "month", "six_months", "year"].includes(timeHorizon) ? (
                  <>
                    <option value="top">▲ Most Upvoted (Top Rated)</option>
                    <option value="newest">Newest First</option>
                  </>
                ) : (
                  <>
                    <option value="newest">Newest First</option>
                    <option value="relevance">Highest Relevance</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Horizontally Scrollable Topic Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleSelectTopic(topic.id)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs transition-smooth ${
                  activeTopic === topic.id
                    ? "bg-[var(--fg-primary)] text-[var(--bg-canvas)] font-semibold"
                    : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-subtle)]"
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs pt-0.5">
              <span className="text-[var(--fg-dim)]">Active filters:</span>
              {activeTopic !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-secondary)] text-[11px]">
                  Topic: {TOPICS.find((t) => t.id === activeTopic)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleSelectTopic("all")} />
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-secondary)] text-[11px]">
                  #{activeTag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveTag("")} />
                </span>
              )}
              {selectedSource && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-secondary)] text-[11px]">
                  Source: {selectedSource}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSource("")} />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-secondary)] text-[11px]">
                  "{searchQuery}"
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                </span>
              )}
              <button onClick={resetFilters} className="text-[var(--accent)] hover:underline text-xs ml-1">
                Clear all
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 3. Main 3-Region Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Refresh feedback toast */}
        {refreshNotice && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              Live news feed refreshed successfully! ({liveItems.length} total stories)
            </span>
            <button onClick={() => setRefreshNotice(false)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Daily Executive Briefing (5-Bullet Digest) */}
        {isLiveView && dailyBriefing.length > 0 && !hasActiveFilters && (
          <DailyBriefing briefing={dailyBriefing} />
        )}

        {/* 3-Region Grid: Feed (Left 2 cols) + Sidebar (Right 1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Region (cols 1..8) */}
          <div className="lg:col-span-8 space-y-6">
            {isLoadingTop ? (
              /* Skeleton Loader */
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] animate-pulse space-y-3">
                  <div className="h-4 bg-[var(--bg-muted)] rounded w-1/4"></div>
                  <div className="h-7 bg-[var(--bg-muted)] rounded w-3/4"></div>
                  <div className="h-4 bg-[var(--bg-muted)] rounded w-full"></div>
                  <div className="h-4 bg-[var(--bg-muted)] rounded w-5/6"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] animate-pulse space-y-2">
                      <div className="h-3 bg-[var(--bg-muted)] rounded w-1/3"></div>
                      <div className="h-5 bg-[var(--bg-muted)] rounded w-4/5"></div>
                      <div className="h-3 bg-[var(--bg-muted)] rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              /* Empty State */
              <div className="text-center py-20 px-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
                <div className="w-10 h-10 mx-auto rounded-full bg-[var(--bg-subtle)] text-[var(--fg-dim)] flex items-center justify-center mb-3">
                  <Filter className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--fg-primary)] mb-1">
                  No matching stories found
                </h3>
                <p className="text-xs text-[var(--fg-muted)] max-w-sm mx-auto mb-4">
                  Try clearing your search query or switching to another topic or timeframe.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-smooth"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Editorial Hierarchy: Hero + Top 5 (On Live Today when unfiltered) */}
                {isLiveView && !hasActiveFilters && heroStory && (
                  <div>
                    <HeroTopStory
                      story={heroStory}
                      isBookmarked={bookmarks.some((b) => b.id === heroStory.id)}
                      onToggleBookmark={toggleBookmark}
                      onSelectTag={setActiveTag}
                      isRead={readIds.has(heroStory.id)}
                      onMarkRead={markStoryAsRead}
                    />

                    {topRankedStories.length > 0 && (
                      <TopRankedList
                        stories={topRankedStories}
                        readIds={readIds}
                        onMarkRead={markStoryAsRead}
                      />
                    )}
                  </div>
                )}

                {/* Editorial Feed Stream */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feedStories.map((item, idx) => {
                    const actualIdx = isLiveView && !hasActiveFilters ? idx + 6 : idx;
                    return (
                      <NewsCard
                        key={item.id}
                        item={item}
                        isBookmarked={bookmarks.some((b) => b.id === item.id)}
                        onToggleBookmark={toggleBookmark}
                        onSelectTag={setActiveTag}
                        isRead={readIds.has(item.id)}
                        onMarkRead={markStoryAsRead}
                        isSelected={selectedStoryIndex === actualIdx}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Region (cols 9..12 on desktop) */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32">
              <Sidebar
                trendingTags={trendingTags}
                activeSources={activeSources}
                activeTag={activeTag}
                onSelectTag={setActiveTag}
                selectedSource={selectedSource}
                onSelectSource={setSelectedSource}
                totalItems={filteredItems.length}
                readCount={readIds.size}
                bookmarksCount={bookmarks.length}
                onMarkAllAsRead={markAllAsRead}
                onViewBookmarks={() => handleSelectTimeHorizon("bookmarks")}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] py-6 text-xs text-[var(--fg-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>MyAIDaily · Strict ≥6/10 Engineering Relevance Filter · Zero Token Overhead</span>
          </div>
          <div className="font-mono text-[11px] text-[var(--fg-dim)]">
            Vercel Edge Cached · Press <kbd className="px-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)]">j / k</kbd> to navigate
          </div>
        </div>
      </footer>
    </div>
  );
}
