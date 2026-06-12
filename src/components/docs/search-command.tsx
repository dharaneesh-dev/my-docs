import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  manifestQueryOptions,
  docQueryOptions,
  type FlatDoc,
} from "@/lib/docs-remote";
import { Search, FileText, Hash, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Hit = {
  doc: FlatDoc;
  score: number;
  titleHit: boolean;
  descHit: boolean;
  snippet?: { before: string; match: string; after: string; heading?: string };
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function scoreDoc(doc: FlatDoc, content: string | undefined, q: string, terms: string[]): Hit | null {
  const t = doc.title.toLowerCase();
  const d = doc.description.toLowerCase();
  const c = doc.category.toLowerCase();
  const body = (content ?? "").toLowerCase();
  const ql = q.toLowerCase();

  let score = 0;
  let titleHit = false;
  let descHit = false;

  if (t === ql) score += 1000;
  if (t.startsWith(ql)) score += 400;
  if (t.includes(ql)) { score += 200; titleHit = true; }
  if (d.includes(ql)) { score += 80; descHit = true; }
  if (c.includes(ql)) score += 40;
  if (body.includes(ql)) score += 60;

  // per-term scoring (AND across terms in title/desc/body)
  let termsHit = 0;
  for (const term of terms) {
    let hit = false;
    if (t.includes(term)) { score += 50; hit = true; titleHit = true; }
    if (d.includes(term)) { score += 20; hit = true; descHit = true; }
    if (c.includes(term)) { score += 10; hit = true; }
    if (body.includes(term)) { score += 15; hit = true; }
    if (hit) termsHit++;
  }
  if (termsHit < terms.length) return null;

  // Build snippet from content if any term matched body
  let snippet: Hit["snippet"];
  if (content) {
    const lowered = body;
    let idx = lowered.indexOf(ql);
    let len = ql.length;
    if (idx === -1) {
      for (const term of terms) {
        const i = lowered.indexOf(term);
        if (i !== -1) { idx = i; len = term.length; break; }
      }
    }
    if (idx !== -1) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(content.length, idx + len + 80);
      // find nearest preceding heading
      const upto = content.slice(0, idx);
      const headingMatch = [...upto.matchAll(/^#{1,6}\s+(.+)$/gm)].pop();
      snippet = {
        before: (start > 0 ? "…" : "") + content.slice(start, idx),
        match: content.slice(idx, idx + len),
        after: content.slice(idx + len, end) + (end < content.length ? "…" : ""),
        heading: headingMatch?.[1]?.trim(),
      };
    }
  }

  return { doc, score, titleHit, descHit, snippet };
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map(escapeRe).join("|")})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) ? (
          <mark key={i} className="rounded-sm bg-primary/20 px-0.5 text-foreground">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const { data: manifest } = useQuery(manifestQueryOptions);

  // Lazy-fetch all doc contents only after the user starts typing
  const shouldFetchContent = open && query.trim().length >= 2;
  const flat = manifest?.flat ?? [];
  const contentQueries = useQueries({
    queries: flat.map((d) =>
      shouldFetchContent
        ? { ...docQueryOptions(d.folder, d.file) }
        : { ...docQueryOptions(d.folder, d.file), enabled: false },
    ),
  });
  const contentMap = useMemo(() => {
    const m = new Map<string, string>();
    flat.forEach((d, i) => {
      const q = contentQueries[i];
      if (q?.data) m.set(d.key, q.data as string);
    });
    return m;
  }, [flat, contentQueries]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const trimmed = query.trim();
  const terms = useMemo(
    () => trimmed.toLowerCase().split(/\s+/).filter((t) => t.length > 0),
    [trimmed],
  );

  const hits = useMemo<Hit[]>(() => {
    if (!trimmed) return [];
    const out: Hit[] = [];
    for (const d of flat) {
      const h = scoreDoc(d, contentMap.get(d.key), trimmed, terms);
      if (h) out.push(h);
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 40);
  }, [flat, contentMap, trimmed, terms]);

  // Group by category for display
  const grouped = useMemo(() => {
    const g = new Map<string, Hit[]>();
    for (const h of hits) {
      const arr = g.get(h.doc.category) ?? [];
      arr.push(h);
      g.set(h.doc.category, arr);
    }
    return [...g.entries()];
  }, [hits]);

  useEffect(() => {
    setActive(0);
  }, [trimmed, hits.length]);

  const go = (h: Hit) => {
    setOpen(false);
    navigate({ to: "/docs/$folder/$slug", params: { folder: h.doc.folder, slug: h.doc.slug } });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) go(hits[active]);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const loadingContent =
    shouldFetchContent && contentQueries.some((q) => q.isLoading);

  // Build absolute index map for keyboard nav across groups
  let runningIdx = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground sm:h-9 sm:w-72 sm:justify-between sm:rounded-md sm:border sm:border-border sm:bg-muted/40 sm:px-3"
        aria-label="Search"
      >
        <span className="flex items-center gap-2 text-[13px]">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search documentation…</span>
        </span>
        <kbd className="ml-2 hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 gap-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-60" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search documentation by title, description, or content…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loadingContent && (
              <span className="ml-2 text-[11px] text-muted-foreground">indexing…</span>
            )}
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {!trimmed && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Start typing to search across all documentation.
              </div>
            )}

            {trimmed && hits.length === 0 && !loadingContent && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for <span className="font-medium text-foreground">"{trimmed}"</span>
              </div>
            )}

            {grouped.map(([category, items]) => (
              <div key={category} className="mb-2">
                <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((h) => {
                    runningIdx++;
                    const idx = runningIdx;
                    const isActive = idx === active;
                    return (
                      <button
                        key={h.doc.key}
                        data-idx={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(h)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition",
                          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                        )}
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            <Highlight text={h.doc.title} terms={terms} />
                          </div>
                          {h.doc.description && (
                            <div className="truncate text-xs text-muted-foreground">
                              <Highlight text={h.doc.description} terms={terms} />
                            </div>
                          )}
                          {h.snippet && (
                            <div className="mt-1 line-clamp-2 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                              {h.snippet.heading && (
                                <span className="mr-1 inline-flex items-center gap-1 font-medium text-foreground/80">
                                  <Hash className="h-3 w-3" />
                                  {h.snippet.heading}
                                </span>
                              )}
                              <span>{h.snippet.before}</span>
                              <mark className="rounded-sm bg-primary/25 px-0.5 text-foreground">
                                {h.snippet.match}
                              </mark>
                              <span>{h.snippet.after}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" /> navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> open
              </span>
              <span>esc to close</span>
            </div>
            {hits.length > 0 && <span>{hits.length} result{hits.length === 1 ? "" : "s"}</span>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
