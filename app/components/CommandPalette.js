"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ExternalLink, Bookmark, ArrowRight, CornerDownLeft } from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  items = [],
  onSelectStory,
  onSelectTopic,
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = query.trim()
    ? items
        .filter(
          (i) =>
            i.title.toLowerCase().includes(query.toLowerCase()) ||
            i.summary.toLowerCase().includes(query.toLowerCase()) ||
            i.source.toLowerCase().includes(query.toLowerCase()) ||
            i.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 8)
    : items.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl rounded-xl bg-[var(--bg-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-3.5 border-b border-[var(--border-default)] flex items-center gap-3">
          <Search className="w-4 h-4 text-[var(--fg-dim)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, topics, tags or press Esc to close..."
            className="flex-1 bg-transparent text-sm text-[var(--fg-primary)] placeholder-[var(--fg-dim)] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--fg-dim)] hover:text-[var(--fg-primary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--fg-muted)]">
              No matching AI news or papers found.
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectStory(item);
                  onClose();
                }}
                className="p-3 rounded-lg hover:bg-[var(--bg-card-hover)] cursor-pointer transition-smooth group"
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-[var(--fg-muted)]">
                  <span className="font-semibold text-[var(--accent)]">{item.source}</span>
                  <span>•</span>
                  <span>{item.pillarLabel}</span>
                  {item.points > 0 && (
                    <span className="ml-auto font-mono text-[10px] font-bold text-amber-500">
                      ▲ {item.points} pts
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-[var(--fg-secondary)] line-clamp-1 mt-0.5">
                  {item.summary}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-[var(--bg-subtle)] border-t border-[var(--border-default)] flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)] font-mono text-[10px]">
                Esc
              </kbd>
              <span>to close</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 rounded bg-[var(--bg-card)] border border-[var(--border-default)] font-mono text-[10px]">
                j / k
              </kbd>
              <span>navigate feed</span>
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--fg-dim)]">
            {items.length} items indexed
          </span>
        </div>
      </div>
    </div>
  );
}
