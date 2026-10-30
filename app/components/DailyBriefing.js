"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, ExternalLink } from "lucide-react";

export default function DailyBriefing({ briefing = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!briefing || briefing.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-xs transition-smooth">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)] flex items-center justify-between transition-smooth text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-primary)]">
            Today's Executive Briefing
          </span>
          <span className="text-[11px] font-mono text-[var(--fg-muted)] hidden sm:inline">
            · 5-minute technical digest
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* 5-Bullet Executive Content */}
      {isOpen && (
        <div className="p-4 sm:p-5 divide-y divide-[var(--border-subtle)]">
          {briefing.slice(0, 5).map((bullet, idx) => (
            <div key={idx} className={`py-2.5 first:pt-0 last:pb-0 flex items-start gap-3`}>
              <span className="w-5 h-5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center text-[10px] font-mono font-bold text-[var(--accent)] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 text-xs">
                <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                  <a
                    href={bullet.link}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[var(--fg-primary)] hover:text-[var(--accent)] transition-colors inline-flex items-center gap-1"
                  >
                    <span>{bullet.title}</span>
                    <ExternalLink className="w-3 h-3 text-[var(--fg-dim)] inline" />
                  </a>
                  <span className="text-[10px] font-mono text-[var(--fg-muted)]">
                    via {bullet.source}
                  </span>
                </div>
                <p className="text-[var(--fg-secondary)] leading-relaxed">
                  {bullet.takeaway}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

