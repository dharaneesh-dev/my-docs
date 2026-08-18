import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, FileText, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { enabledChapters, enabledLessons } from "@/content/registry";
import { cn } from "@/lib/utils";

type Hit = {
  key: string;
  folder: string;
  slug: string;
  title: string;
  description: string;
  category: string;
};

function buildIndex(): Hit[] {
  const hits: Hit[] = [];
  for (const chapter of enabledChapters()) {
    for (const lesson of enabledLessons(chapter)) {
      hits.push({
        key: `${chapter.id}/${lesson.slug}`,
        folder: chapter.id,
        slug: lesson.slug,
        title: `${lesson.number} ${lesson.title}`,
        description: lesson.description,
        category: chapter.label,
      });
    }
  }
  return hits;
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const index = useMemo(buildIndex, []);

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

  const trimmed = query.trim().toLowerCase();
  const hits = useMemo(() => {
    if (!trimmed) return index;
    return index.filter(
      (d) =>
        d.title.toLowerCase().includes(trimmed) ||
        d.description.toLowerCase().includes(trimmed) ||
        d.category.toLowerCase().includes(trimmed),
    );
  }, [index, trimmed]);

  useEffect(() => setActive(0), [trimmed]);

  const go = (hit: Hit) => {
    setOpen(false);
    navigate({ to: "/notes/u/$folder/$slug", params: { folder: hit.folder, slug: hit.slug } });
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

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const grouped = useMemo(() => {
    const g = new Map<string, Hit[]>();
    for (const h of hits) {
      const arr = g.get(h.category) ?? [];
      arr.push(h);
      g.set(h.category, arr);
    }
    return [...g.entries()];
  }, [hits]);

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
              placeholder="Search documentation by title or description…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
            {hits.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No results for <span className="font-medium text-foreground">"{query}"</span>
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
                    return (
                      <button
                        key={h.key}
                        data-idx={idx}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => go(h)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition",
                          idx === active
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50",
                        )}
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{h.title}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {h.description}
                          </div>
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
            {hits.length > 0 && (
              <span>
                {hits.length} result{hits.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
