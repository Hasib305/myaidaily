"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, Check, Copy, ChevronDown, ChevronUp, Flame, Sparkles } from "lucide-react";

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return `${Math.max(1, diffMin)}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `Yesterday`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HeroTopStory({
  story,
  isBookmarked,
  onToggleBookmark,
  onSelectTag,
  isRead,
  onMarkRead,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!story) return null;

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(story.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bullets = story.threeBullets || {
    whatsNew: story.title,
    whyItMatters: story.summary,
    whoShouldCare: "AI Engineers & Software Architects",
  };

  return (
    <article
      className={`p-6 sm:p-7 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:shadow-md transition-smooth flex flex-col justify-between mb-6 group ${
        isRead ? "is-read" : ""
      }`}
    >
      <div>
        {/* Top metadata row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <span className="font-bold text-[var(--accent)] uppercase tracking-wider text-[11px] font-mono">
              ★ Top Story
            </span>
            <span>•</span>
            <span className="font-semibold text-[var(--fg-primary)]">{story.source}</span>
            <span>•</span>
            <span className="font-mono text-[var(--fg-dim)]">{formatRelativeTime(story.date)}</span>
            {story.points > 0 && (
              <span className="font-bold text-amber-500 font-mono text-[11px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                ▲ {story.points.toLocaleString()} pts
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {story.isNew && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                NEW
              </span>
            )}
            {story.isRising && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                Rising
              </span>
            )}
            <button
              onClick={() => onToggleBookmark(story)}
              className={`p-1.5 rounded-md transition-smooth ${
                isBookmarked
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                  : "text-[var(--fg-dim)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Save for later (Press 's')"}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Hero Title (Editorial Serif font) */}
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-[var(--fg-primary)] leading-tight mb-3 group-hover:text-[var(--accent)] transition-colors">
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            onClick={() => onMarkRead(story.id)}
            className="inline-flex items-baseline gap-2"
          >
            <span>{story.title}</span>
            <ExternalLink className="w-4 h-4 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </a>
        </h2>

        {/* 1-2 sentence "Why it matters" summary */}
        <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-4 max-w-3xl">
          {story.summary}
        </p>

        {/* Expand-in-place 3-Bullet TL;DR Accordion */}
        <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-3.5 py-2 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg-primary)] flex items-center justify-between transition-smooth"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{isExpanded ? "Hide Technical Breakdown" : "Deep Dive: 3-Bullet TL;DR"}</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="p-3.5 pt-1 text-xs border-t border-[var(--border-subtle)] space-y-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[var(--accent)] shrink-0 w-24">What's New:</span>
                <span className="text-[var(--fg-primary)]">{bullets.whatsNew}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[var(--accent)] shrink-0 w-24">Why It Matters:</span>
                <span className="text-[var(--fg-secondary)]">{bullets.whyItMatters}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[var(--accent)] shrink-0 w-24">Who Should Care:</span>
                <span className="text-[var(--fg-muted)]">{bullets.whoShouldCare}</span>
              </div>
              <div className="pt-2 flex justify-end">
                <a
                  href={story.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onMarkRead(story.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-smooth"
                >
                  <span>Read Full Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Tags & Quick Actions */}
      <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border-default)]">
            {story.pillarLabel}
          </span>
          {story.tags?.map((t) => (
            <button
              key={t}
              onClick={() => onSelectTag(t)}
              className="text-[11px] font-mono text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors"
            >
              #{t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="text-[11px] font-mono text-[var(--fg-muted)] hover:text-[var(--fg-primary)] flex items-center gap-1 transition-smooth"
            title="Copy link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Share</span>
              </>
            )}
          </button>
          <a
            href={story.link}
            target="_blank"
            rel="noreferrer"
            onClick={() => onMarkRead(story.id)}
            className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-smooth"
          >
            <span>Read original</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}

