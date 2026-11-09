"use client";
import MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Doc = { id: string; title: string; kind: string; href: string; hint: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => input.current?.focus(), 20);
    if (!docs) fetch("/api/v1/search-index").then((r) => r.json()).then(setDocs).catch(() => setDocs([]));
  }, [open, docs]);

  const mini = useMemo(() => {
    if (!docs) return null;
    const m = new MiniSearch<Doc>({ fields: ["title", "hint", "kind"], storeFields: ["title", "kind", "href", "hint"], searchOptions: { prefix: true, fuzzy: 0.2, boost: { title: 3 } } });
    m.addAll(docs);
    return m;
  }, [docs]);

  const results = useMemo(() => {
    if (!docs) return [];
    if (!q.trim()) return docs.filter((d) => d.kind === "Page").slice(0, 8);
    return (mini?.search(q).slice(0, 9) ?? []).map((r) => r as unknown as Doc);
  }, [q, mini, docs]);

  useEffect(() => setIdx(0), [q]);

  const go = useCallback(
    (d: Doc) => {
      setOpen(false);
      setQ("");
      router.push(d.href);
    },
    [router],
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid items-start justify-items-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Search" className="glass rise w-full max-w-xl rounded-lg" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
            if (e.key === "Enter" && results[idx]) go(results[idx]);
          }}
          placeholder="Search Resonators, weapons, Echoes, tools…"
          aria-label="Search"
          className="w-full rounded-b-none border-0 border-b border-line2 bg-transparent px-4 py-3.5 text-base"
        />
        <ul role="listbox" className="max-h-[50vh] overflow-auto p-1.5">
          {!docs && <li className="p-4 text-dim"><span className="wave-loader"><i /><i /><i /></span></li>}
          {docs && results.length === 0 && <li className="p-4 text-[13px] text-dim">No results for “{q}”.</li>}
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === idx}>
              <button onMouseEnter={() => setIdx(i)} onClick={() => go(r)} className={`flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left ${i === idx ? "bg-accent/15" : ""}`}>
                <span>
                  <span className="block text-[14px]">{r.title}</span>
                  <span className="block text-[11px] text-dim">{r.hint}</span>
                </span>
                <span className="chip">{r.kind}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-line px-4 py-2 text-[11px] text-dim">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>Tideforge search</span>
        </div>
      </div>
    </div>
  );
}
