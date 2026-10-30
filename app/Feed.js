"use client";
import { useState, useMemo } from "react";

const ago = (t) => {
  const h = Math.max(1, Math.round((Date.now() - t) / 36e5));
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

export default function Feed({ items }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const tags = useMemo(() => {
    const c = {};
    items.forEach((i) => i.tags?.forEach((t) => (c[t] = (c[t] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => x[0]);
  }, [items]);
  const shown = items.filter(
    (i) =>
      (!tag || i.tags?.includes(tag)) &&
      (i.title + i.summary).toLowerCase().includes(q.toLowerCase())
  );
  return (
    <>
      <input placeholder="Search (rag, kag, mcp...)" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tags">
        {tags.map((t) => (
          <button key={t} className={t === tag ? "on" : ""} onClick={() => setTag(t === tag ? "" : t)}>{t}</button>
        ))}
      </div>
      {shown.map((i) => (
        <a key={i.link} href={i.link} target="_blank" rel="noreferrer" className="card">
          <div className="meta">{i.source} · {ago(i.date)}</div>
          <h2>{i.title}</h2>
          <p>{i.summary}</p>
          <div className="meta">{i.tags?.map((t) => <span key={t} className="pill">{t}</span>)}</div>
        </a>
      ))}
    </>
  );
}
