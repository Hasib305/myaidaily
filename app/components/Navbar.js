"use client";

import { Search, Bookmark, RefreshCw, Sun, Moon, Command } from "lucide-react";

export default function Navbar({
  onOpenCommandPalette,
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
      if (diffMin === 1) return "1m ago";
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours}h ago`;
    } catch {
      return "Just now";
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-default)] transition-colors h-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Brand Logo & Edition */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
          onClick={() => onSelectTab("live")}
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-sm">
            AI
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-[var(--fg-primary)]">
              MyAIDaily
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)] hidden sm:inline">
              Engineering Wire
            </span>
          </div>
        </div>

        {/* Command Palette Trigger Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full h-8 px-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] hover:border-[var(--border-hover)] text-xs text-[var(--fg-muted)] flex items-center justify-between transition-smooth"
            aria-label="Open command palette"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--fg-dim)]" />
              <span>Search stories, topics, tags...</span>
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-default)] text-[var(--fg-muted)] flex items-center gap-0.5">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Action Controls: Refresh, Saved, Theme */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--fg-muted)] sm:hidden"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:border-[var(--border-hover)] transition-smooth disabled:opacity-60"
            title="Fetch latest updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent)] ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden md:inline font-mono text-[11px]">
              {isRefreshing ? "Updating..." : formatUpdateTime(lastUpdated)}
            </span>
          </button>

          {/* Saved Bookmarks */}
          <button
            onClick={() => onSelectTab(activeTab === "bookmarks" ? "live" : "bookmarks")}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-smooth ${
              activeTab === "bookmarks"
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--bg-subtle)] text-[var(--fg-secondary)] border-[var(--border-default)] hover:text-[var(--fg-primary)] hover:border-[var(--border-hover)]"
            }`}
            title="Saved reading list (Press 's' on any card to save)"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarksCount > 0 ? "fill-amber-500 text-amber-500" : ""}`} />
            <span className="hidden sm:inline">Saved</span>
            {bookmarksCount > 0 && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-muted)] text-[var(--fg-primary)]">
                {bookmarksCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 h-8 w-8 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:border-[var(--border-hover)] flex items-center justify-center transition-smooth"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
