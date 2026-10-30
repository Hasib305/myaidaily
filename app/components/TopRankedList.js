"use client";

import { ExternalLink, Trophy } from "lucide-react";

export default function TopRankedList({
  stories = [],
  readIds = new Set(),
  onMarkRead,
}) {
  if (!stories || stories.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 sm:p-5 mb-6 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Top Ranked Today
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[var(--fg-dim)]">5 Key Shifts</span>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {stories.slice(0, 5).map((item, index) => {
          const isRead = readIds.has(item.id);
          return (
            <article
              key={item.id}
              className={`py-3 first:pt-0 last:pb-0 flex items-start gap-3 group transition-smooth ${
                isRead ? "is-read" : ""
              }`}
            >
              {/* Rank number badge */}
              <span className="w-5 h-5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-xs font-mono font-bold text-[var(--fg-secondary)] shrink-0 mt-0.5 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-[var(--fg-muted)] mb-1">
                  <span className="font-semibold text-[var(--accent)]">{item.source}</span>
                  {item.points > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-bold text-amber-500">
                        ▲ {item.points} pts
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{item.pillarLabel}</span>
                </div>

                <h4 className="font-headline text-sm font-bold text-[var(--fg-primary)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => onMarkRead(item.id)}
                    className="inline-flex items-baseline gap-1"
                  >
                    <span>{item.title}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[var(--accent)] inline shrink-0" />
                  </a>
                </h4>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

