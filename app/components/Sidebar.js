"use client";

import { CheckCheck, Tag, Rss, Keyboard, Bookmark } from "lucide-react";

export default function Sidebar({
  trendingTags = [],
  activeSources = [],
  activeTag,
  onSelectTag,
  selectedSource,
  onSelectSource,
  totalItems = 0,
  readCount = 0,
  bookmarksCount = 0,
  onMarkAllAsRead,
  onViewBookmarks,
}) {
  const unreadCount = Math.max(0, totalItems - readCount);

  return (
    <aside className="w-full space-y-6">
      {/* 1. Reading Status & Mark All As Read */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Reading Status
          </span>
          <span className="text-[11px] font-mono text-[var(--fg-muted)]">
            {unreadCount} unread
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <button
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="w-full py-1.5 px-2.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--fg-secondary)] flex items-center justify-center gap-1.5 transition-smooth disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark all as read</span>
          </button>

          <button
            onClick={onViewBookmarks}
            className="w-full py-1.5 px-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg-primary)] flex items-center justify-between transition-smooth"
          >
            <span className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span>Saved Articles</span>
            </span>
            <span className="font-mono text-[10px] font-bold">{bookmarksCount}</span>
          </button>
        </div>
      </div>

      {/* 2. Trending Topics Cloud */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-[var(--border-subtle)]">
          <Tag className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Trending Topics
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {trendingTags.slice(0, 10).map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => onSelectTag(activeTag === tag ? "" : tag)}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md border transition-smooth ${
                activeTag === tag
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border-subtle)] hover:text-[var(--fg-primary)] hover:border-[var(--border-default)]"
              }`}
            >
              #{tag} <span className="opacity-60 text-[10px]">({count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Active Sources Filter */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-[var(--border-subtle)]">
          <Rss className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Sources Ingested
          </span>
        </div>

        <div className="space-y-1 text-xs">
          {activeSources.slice(0, 8).map(({ name, count }) => (
            <button
              key={name}
              onClick={() => onSelectSource(selectedSource === name ? "" : name)}
              className={`w-full px-2 py-1 rounded-md text-left flex items-center justify-between transition-smooth ${
                selectedSource === name
                  ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <span className="line-clamp-1">{name}</span>
              <span className="font-mono text-[10px] text-[var(--fg-dim)]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Keyboard Shortcuts Cheatsheet */}
      <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[var(--border-subtle)]">
          <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Keyboard Shortcuts
          </span>
        </div>

        <div className="space-y-1 text-[11px] text-[var(--fg-muted)] font-mono">
          <div className="flex justify-between py-0.5">
            <span className="font-bold text-[var(--fg-primary)]">j / k</span>
            <span>Next / Prev story</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="font-bold text-[var(--fg-primary)]">s</span>
            <span>Save / Bookmark</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="font-bold text-[var(--fg-primary)]">o</span>
            <span>Open article</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="font-bold text-[var(--fg-primary)]">⌘K or /</span>
            <span>Search palette</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

