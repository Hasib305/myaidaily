"use client";

import { Search, Bookmark, RefreshCw, Sun, Moon } from "lucide-react";

export default function Navbar({
  searchQuery,
  onSearchChange,
  bookmarksCount,
  activeTab,
  onSelectTab,
  isRefreshing,
  onRefresh,
  lastUpdated,
  isDark,
  onToggleTheme,
}) {
  const formatUpdateTime = (dateStr) => {
    if (!dateStr) return "Just now";
    try {
      const diffMin = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
      if (diffMin === 0) return "Just now";
      if (diffMin === 1) return "1 min ago";
      if (diffMin < 60) return `${diffMin} mins ago`;
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ago`;
    } catch {
      return "Just now";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-[var(--border)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Headline */}
          <div
            className="flex items-center gap-3 cursor-pointer shrink-0"
            onClick={() => onSelectTab("all")}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm tracking-tighter">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[var(--fg)]">
                  AI Pulse
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)]">
                  Engineering Wire
                </span>
              </div>
              <p className="text-[11px] text-[var(--fg-dim)] hidden md:block">
                Daily updates on new AI models, frameworks & papers
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--fg-dim)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search news (e.g. kag, rag, mcp, reasoning, vllm)..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-dim)] focus:outline-none focus:border-blue-500 focus:bg-[var(--bg)] transition-colors"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--fg-dim)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                /
              </kbd>
            </div>
          </div>

          {/* Controls: Refresh, Saved, Theme */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--fg-dim)] transition-colors disabled:opacity-60"
              title="Fetch latest news from RSS feeds now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              <span className="text-[10px] text-[var(--fg-dim)] font-mono hidden lg:inline">
                ({formatUpdateTime(lastUpdated)})
              </span>
            </button>

            {/* Saved Bookmarks */}
            <button
              onClick={() => onSelectTab(activeTab === "bookmarks" ? "all" : "bookmarks")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeTab === "bookmarks"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border)] hover:text-[var(--fg)] hover:border-[var(--fg-dim)]"
              }`}
              title="Saved reading list"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarksCount > 0 ? "fill-amber-500 text-amber-500" : ""}`} />
              <span className="hidden sm:inline">Saved</span>
              {bookmarksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[10px] font-mono">
                  {bookmarksCount}
                </span>
              )}
            </button>

            {/* Dark/Light Theme Switch */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 sm:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--fg-dim)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search news..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg)] placeholder-[var(--fg-dim)] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
