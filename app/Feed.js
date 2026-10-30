"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "./components/Navbar";
import NewsCard from "./components/NewsCard";
import { Filter, X, ChevronDown, ChevronUp, Info, Check } from "lucide-react";

const TOPICS = [
  { id: "all", label: "All Topics" },
  { id: "models-reasoning", label: "Models & Reasoning" },
  { id: "agents-mcp", label: "Agents & Tools" },
  { id: "knowledge-retrieval", label: "Retrieval & RAG" },
  { id: "infra-serving", label: "Inference & Serving" },
  { id: "devtools-coding", label: "Developer Tools" },
  { id: "research-papers", label: "Research & Papers" },
];

const QUICK_EXPLAINERS = [
  { term: "KAG", def: "Knowledge-Augmented Generation: Combines LLMs with knowledge graphs & logic solvers to replace naive RAG vector joins with verified facts." },
  { term: "MCP", def: "Model Context Protocol: Anthropic's universal open standard for connecting AI agents to external tools, databases, and IDEs." },
  { term: "GRPO", def: "Group Relative Policy Optimization: DeepSeek-R1's RL algorithm enabling reasoning models to self-improve without a separate Critic model." },
  { term: "RadixAttention", def: "SGLang's KV-cache reuse tree: Retains shared prompt prefixes across multi-turn agent chats to cut latency by 80%." },
  { term: "SLMs", def: "Small Language Models: 1B-8B parameter models (Llama 3.2, Gemma 2, Phi-4) running locally on consumer hardware." },
];

export default function Feed({ initialData }) {
  // Live Data State
  const [items, setItems] = useState(initialData?.items || []);
  const [stats, setStats] = useState(initialData?.stats || {});
  const [lastUpdated, setLastUpdated] = useState(initialData?.stats?.updatedAt || new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState(false);

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("all"); // 'all' | 'today' | 'week' | 'month' | 'bookmarks'
  const [activeTopic, setActiveTopic] = useState("all");
  const [activeTag, setActiveTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'relevance'
  const [bookmarks, setBookmarks] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
    } catch { }

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

  // Live Refresh handler
  const handleLiveRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/news?refresh=true");
      if (res.ok) {
        const fresh = await res.json();
        if (fresh.items && fresh.items.length > 0) {
          setItems(fresh.items);
          setStats(fresh.stats);
          setLastUpdated(fresh.stats.updatedAt);
          setRefreshNotice(true);
          setTimeout(() => setRefreshNotice(false), 3000);
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
    } catch { }
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
    } catch { }
  };

  // Filtered stories
  const filteredItems = useMemo(() => {
    let list = items;

    if (timeHorizon === "today") {
      list = list.filter((i) => i.isToday);
    } else if (timeHorizon === "week") {
      list = list.filter((i) => i.isThisWeek);
    } else if (timeHorizon === "month") {
      list = list.filter((i) => i.isThisMonth);
    } else if (timeHorizon === "bookmarks") {
      list = bookmarks;
    }

    if (activeTopic !== "all") {
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

    const sorted = [...list];
    if (sortBy === "newest") {
      sorted.sort((a, b) => b.date - a.date);
    } else if (sortBy === "relevance") {
      sorted.sort((a, b) => (b.score ?? 5) - (a.score ?? 5) || b.date - a.date);
    }

    return sorted;
  }, [items, bookmarks, timeHorizon, activeTopic, activeTag, searchQuery, sortBy]);

  const resetFilters = () => {
    setTimeHorizon("all");
    setActiveTopic("all");
    setActiveTag("");
    setSearchQuery("");
  };

  const hasActiveFilters = activeTopic !== "all" || activeTag || searchQuery.trim() || timeHorizon !== "all";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      {/* Top Clean Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        bookmarksCount={bookmarks.length}
        activeTab={timeHorizon}
        onSelectTab={(tab) => setTimeHorizon(tab)}
        isRefreshing={isRefreshing}
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
              Live news feed refreshed successfully! ({items.length} total articles)
            </span>
            <button onClick={() => setRefreshNotice(false)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Reference Guide Toggle (Explains KAG, MCP, etc.) */}
        <div className="mb-6 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full px-4 py-2.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] flex items-center justify-between transition-colors font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Quick Reference: What are these new AI technologies? (KAG, MCP, GRPO, vLLM)
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showGuide && (
            <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {QUICK_EXPLAINERS.map((q) => (
                <div key={q.term} className="p-2.5 rounded bg-[var(--bg)] border border-[var(--border-subtle)]">
                  <span className="font-bold text-blue-600 dark:text-blue-400 block mb-0.5">{q.term}</span>
                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">{q.def}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clean Filter Bar */}
        <div className="mb-6 space-y-3">
          {/* Row 1: Time Horizon Tabs & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimeHorizon("all")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeHorizon === "all"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                  }`}
              >
                All Stories ({items.length})
              </button>

              <button
                onClick={() => setTimeHorizon("today")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeHorizon === "today"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                  }`}
              >
                Today ({stats.todayCount || 0})
              </button>

              <button
                onClick={() => setTimeHorizon("week")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeHorizon === "week"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                  }`}
              >
                Past 7 Days ({stats.weekCount || 0})
              </button>

              <button
                onClick={() => setTimeHorizon("month")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeHorizon === "month"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
                  }`}
              >
                This Month
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-dim)]">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] px-2 py-1 rounded text-xs focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="relevance">Highest Technical Relevance</option>
              </select>
            </div>
          </div>

          {/* Row 2: Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTopic(t.id)}
                className={`whitespace-nowrap px-2.5 py-1 text-xs rounded border transition-colors ${activeTopic === t.id
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
                  {TOPICS.find((t) => t.id === activeTopic)?.label}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveTopic("all")} />
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

        {/* News Feed Stream */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">No matching articles found</h3>
            <p className="text-xs text-[var(--fg-dim)] max-w-sm mx-auto mb-4">
              Try clearing your search query or switching to another topic or timeframe.
            </p>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              Show All Stories
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
            MyAIDaily · Live RSS Ingestion from arXiv, Hugging Face, The Hacker News, OpenAI, Anthropic, Google & Hacker News
          </div>
          <div className="font-mono text-[11px]">
            Zero API Tokens Consumed · Edge Cached on Vercel
          </div>
        </div>
      </footer>
    </div>
  );
}
