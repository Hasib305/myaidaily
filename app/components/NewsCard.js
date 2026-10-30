"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, Check, Copy, ChevronDown, ChevronUp, Flame, Sparkles, Layers } from "lucide-react";

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

export default function NewsCard({
  item,
  isBookmarked,
  onToggleBookmark,
  onSelectTag,
  isRead = false,
  onMarkRead,
  isSelected = false,
}) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOtherSources, setShowOtherSources] = useState(false);

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bullets = item.threeBullets || {
    whatsNew: item.title,
    whyItMatters: item.summary,
    whoShouldCare: "AI & Software Engineers",
  };

  const hasOtherSources = item.otherSources && item.otherSources.length > 0;

  return (
    <article
      id={`story-${item.id}`}
      className={`p-5 rounded-xl bg-[var(--bg-card)] border transition-smooth flex flex-col justify-between group ${
        isSelected
          ? "keyboard-active shadow-md"
          : "border-[var(--border-default)] hover:border-[var(--border-hover)] hover:shadow-xs"
      } ${isRead ? "is-read" : ""}`}
    >
      <div>
        {/* Source, Points, Relative Time, Badges */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] flex-wrap">
            <span className="font-semibold text-[var(--accent)]">{item.source}</span>
            {item.points > 0 && (
              <span className="font-bold text-amber-500 font-mono text-[10px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                ▲ {item.points.toLocaleString()}
              </span>
            )}
            <span className="text-[var(--fg-dim)]">•</span>
            <span className="text-[var(--fg-dim)] font-mono text-[11px]">{formatRelativeTime(item.date)}</span>
          </div>

          <div className="flex items-center gap-1">
            {item.isNew && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                NEW
              </span>
            )}
            {item.isRising && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800 flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-orange-500" />
                Rising
              </span>
            )}
            {/* Bookmark button */}
            <button
              onClick={() => onToggleBookmark(item)}
              className={`p-1 rounded transition-smooth ${
                isBookmarked
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                  : "text-[var(--fg-dim)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[var(--fg-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Save for later (s)"}
              aria-label="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Headline (Editorial Serif font, max 2 lines) */}
        <h3 className="font-headline text-base font-bold text-[var(--fg-primary)] leading-snug mb-2 group-hover:text-[var(--accent)] transition-colors line-clamp-2">
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            onClick={() => onMarkRead?.(item.id)}
            className="inline-flex items-baseline gap-1"
          >
            <span>{item.title}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[var(--accent)] inline shrink-0 transition-opacity" />
          </a>
        </h3>

        {/* 1-2 sentence "Why it matters" summary */}
        <p className="text-xs text-[var(--fg-secondary)] leading-relaxed mb-3 line-clamp-3">
          {item.summary}
        </p>

        {/* Group Duplicate Stories ("Also covered by X sources") */}
        {hasOtherSources && (
          <div className="mb-3">
            <button
              onClick={() => setShowOtherSources(!showOtherSources)}
              className="text-[11px] font-mono text-[var(--fg-muted)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
            >
              <Layers className="w-3 h-3 text-[var(--accent)]" />
              <span>Also covered by {item.otherSources.length} other {item.otherSources.length === 1 ? "source" : "sources"}</span>
              {showOtherSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showOtherSources && (
              <div className="mt-1.5 p-2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs animate-in fade-in duration-100">
                {item.otherSources.map((alt, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                    <a
                      href={alt.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--fg-primary)] hover:text-[var(--accent)] line-clamp-1 font-medium"
                    >
                      {alt.title}
                    </a>
                    <span className="font-mono text-[var(--fg-muted)] shrink-0">
                      via {alt.source}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Expand-in-place 3-Bullet TL;DR Accordion */}
        <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] overflow-hidden mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-2.5 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-primary)] flex items-center justify-between transition-smooth"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span>{isExpanded ? "Hide TL;DR" : "TL;DR (3 Bullets)"}</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {isExpanded && (
            <div className="p-3 pt-1 text-xs border-t border-[var(--border-subtle)] space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[var(--accent)] text-[11px] shrink-0 w-20">What's New:</span>
                <span className="text-[var(--fg-primary)] text-[11px]">{bullets.whatsNew}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[var(--accent)] text-[11px] shrink-0 w-20">Why It Matters:</span>
                <span className="text-[var(--fg-secondary)] text-[11px]">{bullets.whyItMatters}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-[var(--accent)] text-[11px] shrink-0 w-20">Who Cares:</span>
                <span className="text-[var(--fg-muted)] text-[11px]">{bullets.whoShouldCare}</span>
              </div>
              <div className="pt-1.5 flex justify-end">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onMarkRead?.(item.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                >
                  <span>Read original source</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {/* Footer Tags & Actions */}
        <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border-default)]">
              {item.pillarLabel}
            </span>
            {item.tags?.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag(t)}
                className="text-[10px] font-mono text-[var(--fg-dim)] hover:text-[var(--accent)] transition-colors"
              >
                #{t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="text-[10px] font-mono text-[var(--fg-dim)] hover:text-[var(--fg-primary)] flex items-center gap-0.5 transition-colors"
              title="Copy link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              onClick={() => onMarkRead?.(item.id)}
              className="text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-0.5 transition-colors"
            >
              <span>Read</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
