import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, Menu } from "lucide-react";
import { TopNav } from "@/components/docs/top-nav";
import { DocsSidebar } from "@/components/docs/sidebar";
import { SiteFooter } from "@/components/docs/site-footer";
import { TableOfContents, type TocItem } from "@/components/docs/toc";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  getChapter,
  getLesson,
  enabledLessons,
  isChapterEnabled,
  isLessonEnabled,
} from "@/content/registry";

export const Route = createFileRoute("/notes/u/$folder/$slug")({
  loader: ({ params }) => {
    const chapter = getChapter(params.folder);
    const lesson = chapter && getLesson(params.folder, params.slug);
    if (!chapter || !lesson) throw notFound();
    // Only serializable data goes through loader data — the chapter/lesson objects hold a
    // `Component` function reference, which cannot be serialized for SSR hydration (this was
    // the cause of a blank page on hard refresh). The component re-derives everything else
    // straight from params via the same (cheap, synchronous, server/client-identical) registry
    // lookups instead.
    const disabled = !isChapterEnabled(chapter) || !isLessonEnabled(lesson);
    return { disabled };
  },
  head: ({ params }) => {
    const lesson = getLesson(params.folder, params.slug);
    const title = lesson ? `${lesson.title} — Knowledge Base` : "Docs";
    const desc = lesson?.description ?? "Documentation — engineering notes by Dharaneesh Boobalan.";
    const url = `https://docs.dharaneesh.in/notes/u/${params.folder}/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-medium">Doc not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check the URL.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </div>
  ),
  component: DocPage,
});

const SIDEBAR_KEY = "docs:sidebar:w";
const SIDEBAR_DEFAULT = 260;
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

function DocPage() {
  const { folder, slug } = Route.useParams();
  const { disabled } = Route.useLoaderData();
  // Re-derived directly from params (not loader data) — see the loader comment above.
  const chapter = getChapter(folder)!;
  const lesson = getLesson(folder, slug)!;
  const list = enabledLessons(chapter);
  const idx = list.findIndex((l) => l.slug === slug);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const [open, setOpen] = useState(false);
  const [sidebarW, setSidebarW] = useState(SIDEBAR_DEFAULT);
  const [toc, setToc] = useState<TocItem[]>([]);
  const dragging = useRef(false);
  const articleRef = useRef<HTMLDivElement>(null);
  const LessonComponent = lesson.Component;

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_KEY);
      if (v) setSidebarW(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(v, 10))));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setSidebarW(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem(SIDEBAR_KEY, String(sidebarW));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sidebarW]);

  useEffect(() => {
    const nodes = articleRef.current?.querySelectorAll<HTMLElement>("[data-toc-label]");
    setToc(
      Array.from(nodes ?? [])
        .filter((n) => n.id)
        .map((n) => ({ id: n.id, text: n.dataset.tocLabel ?? n.id })),
    );
  }, [lesson.slug]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav
        left={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Open navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-sidebar p-0">
              <DocsSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        }
      />

      <div
        className="grid w-full grid-cols-1 gap-0 lg:grid-cols-[var(--sb)_4px_minmax(0,1fr)_240px]"
        style={{ ["--sb" as string]: `${sidebarW}px` }}
      >
        <aside className="hidden border-r border-border bg-sidebar lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <DocsSidebar />
          </div>
        </aside>

        <div
          onMouseDown={startDrag}
          onDoubleClick={() => {
            setSidebarW(SIDEBAR_DEFAULT);
            try {
              localStorage.setItem(SIDEBAR_KEY, String(SIDEBAR_DEFAULT));
            } catch {
              /* ignore */
            }
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          title="Drag to resize · double-click to reset"
          className="group relative hidden cursor-col-resize lg:block"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition group-hover:bg-primary/50" />
        </div>

        <article ref={articleRef} className="min-w-0">
          <div className="w-full px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
            <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              <Link to="/" className="hover:text-foreground hover:underline">
                Home
              </Link>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span>{chapter.label}</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="truncate text-foreground">{lesson.title}</span>
            </nav>

            <header className="mb-6 border-b border-border pb-5">
              <div className="text-[12px] font-medium uppercase tracking-wider text-primary">
                {chapter.label} · {lesson.number}
              </div>
              <h1 className="mt-1 font-display text-[26px] font-normal leading-tight tracking-tight text-foreground sm:text-[28px]">
                {lesson.title}
              </h1>
              {lesson.description && (
                <p className="mt-2 text-[14px] text-muted-foreground">{lesson.description}</p>
              )}
            </header>

            <details className="mb-6 rounded-md border border-border bg-card/40 px-3 py-2 text-[13px] lg:hidden">
              <summary className="cursor-pointer select-none text-muted-foreground">
                On this page
              </summary>
              <div className="mt-3">
                <TableOfContents items={toc} />
              </div>
            </details>

            {disabled ? (
              <div className="max-w-[760px] rounded-lg border border-destructive/40 bg-destructive/5 p-6">
                <h2 className="text-[16px] font-medium text-foreground">
                  This {isLessonEnabled(lesson) ? "chapter" : "lesson"} isn't available right now
                </h2>
                <p className="mt-2 text-[13.5px] text-muted-foreground">
                  It's been turned off in <code>registry.tsx</code> (set <code>enabled: false</code>
                  ). Flip it back to <code>true</code> and refresh to bring it back — nothing else
                  needs to change.
                </p>
              </div>
            ) : (
              <LessonComponent />
            )}

            {!disabled && (prev || next) && (
              <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                {prev ? (
                  <Link
                    to="/notes/u/$folder/$slug"
                    params={{ folder: chapter.id, slug: prev.slug }}
                    className="flex w-full flex-col items-start gap-1 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-muted/50 sm:w-1/2"
                  >
                    <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
                      Previous
                    </span>
                    <span className="text-[15px] font-medium text-foreground">{prev.title}</span>
                  </Link>
                ) : (
                  <div className="hidden sm:block sm:w-1/2" />
                )}

                {next ? (
                  <Link
                    to="/notes/u/$folder/$slug"
                    params={{ folder: chapter.id, slug: next.slug }}
                    className="flex w-full flex-col items-end gap-1 rounded-lg border border-border p-4 text-right transition-colors hover:border-primary/50 hover:bg-muted/50 sm:w-1/2"
                  >
                    <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
                      Next
                    </span>
                    <span className="text-[15px] font-medium text-foreground">{next.title}</span>
                  </Link>
                ) : (
                  <div className="hidden sm:block sm:w-1/2" />
                )}
              </div>
            )}
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-5 py-10">
            <TableOfContents items={toc} />
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
