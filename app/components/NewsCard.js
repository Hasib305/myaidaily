"use client";

import { useState } from "react";
import { ExternalLink, Bookmark, Check, Copy } from "lucide-react";

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

export default function NewsCard({ item, isBookmarked, onToggleBookmark, onSelectTag }) {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`[${item.title}]\n${item.summary}\nSource: ${item.link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="group p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-blue-400 hover:shadow-sm transition-all flex flex-col justify-between">
      <div>
        {/* Source & Timestamp */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{item.source}</span>
            {item.points > 0 && (
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                ▲ {item.points.toLocaleString()} pts
              </span>
            )}
            <span className="text-[var(--fg-dim)]">•</span>
            <span className="text-[var(--fg-dim)] font-mono">{formatRelativeTime(item.date)}</span>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleBookmark(item)}
            className={`p-1.5 rounded-md transition-colors ${
              isBookmarked
                ? "text-amber-500 bg-amber-50 dark:bg-amber-950/40"
                : "text-[var(--fg-dim)] hover:text-[var(--fg)] hover:bg-[var(--bg-subtle)]"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Save article"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-500" : ""}`} />
          </button>
        </div>

        {/* Headline */}
        <h3 className="text-base font-bold text-[var(--fg)] leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-baseline gap-1"
          >
            <span>{item.title}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-0.5 text-blue-600 dark:text-blue-400 shrink-0 inline-block" />
          </a>
        </h3>

        {/* Summary */}
        <p className="text-xs text-[var(--fg-muted)] leading-relaxed mb-4">{item.summary}</p>
      </div>

      <div>
        {/* Topic Tag & Copy Summary */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-[var(--fg-dim)] bg-[var(--bg-subtle)] px-2 py-0.5 rounded border border-[var(--border)]">
              {item.pillarLabel || "Research"}
            </span>
            {item.tags?.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag(t)}
                className="text-[10px] font-mono text-[var(--fg-dim)] hover:text-blue-600 transition-colors"
              >
                #{t}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopySummary}
            className="text-[11px] font-mono text-[var(--fg-dim)] hover:text-[var(--fg)] flex items-center gap-1 transition-colors"
            title="Copy summary"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>TL;DR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
