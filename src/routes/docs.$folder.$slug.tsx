import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronRight, Menu, Github } from "lucide-react";
import { DOCS_REPO } from "@/lib/docs-remote";
import { TopNav } from "@/components/docs/top-nav";
import { DocsSidebar } from "@/components/docs/sidebar";
import { SiteFooter } from "@/components/docs/site-footer";
import { ShareButton } from "@/components/docs/share-button";

import { Markdown } from "@/components/docs/markdown";
import { Loader } from "@/components/docs/loader";
import { TableOfContents, extractToc } from "@/components/docs/toc";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  docQueryOptions,
  findDoc,
  manifestQueryOptions,
} from "@/lib/docs-remote";

export const Route = createFileRoute("/docs/$folder/$slug")({
  loader: async ({ context, params }) => {
    const manifest = await context.queryClient.ensureQueryData(manifestQueryOptions);
    const doc = findDoc(manifest.flat, params.folder, params.slug);
    if (!doc) throw notFound();
    await context.queryClient.ensureQueryData(docQueryOptions(doc.folder, doc.file));
    return { doc };
  },
  head: ({ loaderData, params }) => {
    const d = loaderData?.doc;
    const title = d ? `${d.title} — Knowledge Base` : "Docs";
    const desc =
      d?.description ??
      `${d?.title ?? "Documentation"} — engineering notes by Dharaneesh Boobalan.`;
    const url = `https://docs.dharaneesh.in/docs/${params.folder}/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: `${d?.category ?? "docs"}, ${d?.title ?? ""}, knowledge base, documentation, Dharaneesh Boobalan` },
        { name: "author", content: "Dharaneesh Boobalan" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: "https://docs.dharaneesh.in/favicon.png" },
        { property: "article:author", content: "Dharaneesh Boobalan" },
        { property: "article:section", content: d?.category ?? "Docs" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: "https://docs.dharaneesh.in/favicon.png" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: d
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "TechArticle",
                headline: d.title,
                description: desc,
                author: { "@type": "Person", name: "Dharaneesh Boobalan" },
                articleSection: d.category,
                url,
              }),
            },
          ]
        : [],
    };
  },
  pendingComponent: () => (
    <div className="min-h-screen">
      <TopNav />
      <Loader label="Loading doc" />
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <TopNav />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-medium">Doc not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check the URL or the doc's config.json entry.
        </p>
        <Link to="/" className="mt-6 inline-block rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          Go home
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="px-6 py-24 text-center">
      <h1 className="text-lg font-medium">Failed to load doc</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded border border-border px-3 py-1.5 text-sm">
        Retry
      </button>
    </div>
  ),
  component: DocPage,
});

const SIDEBAR_KEY = "docs:sidebar:w";
const SIDEBAR_DEFAULT = 260;
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

function DocPage() {
  const { doc } = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  const [sidebarW, setSidebarW] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_KEY);
      if (v) setSidebarW(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, parseInt(v, 10))));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
      setSidebarW(w);
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try { localStorage.setItem(SIDEBAR_KEY, String(sidebarW)); } catch { /* ignore */ }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [sidebarW]);

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
          onDoubleClick={() => { setSidebarW(SIDEBAR_DEFAULT); try { localStorage.setItem(SIDEBAR_KEY, String(SIDEBAR_DEFAULT)); } catch { /* ignore */ } }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          title="Drag to resize · double-click to reset"
          className="group relative hidden cursor-col-resize lg:block"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition group-hover:bg-primary/50" />
        </div>

        <article className="min-w-0">
          <div className="w-full px-5 py-6 sm:px-7 lg:px-10 lg:py-8">

            <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              <Link to="/" className="hover:text-foreground hover:underline">Home</Link>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span>Docs</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span>{doc.category}</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
              <span className="truncate text-foreground">{doc.title}</span>
            </nav>

            <header className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[26px] font-normal leading-tight tracking-tight text-foreground sm:text-[28px]">
                  {doc.title}
                </h1>
                {doc.description && (
                  <p className="mt-2 text-[14px] text-muted-foreground">{doc.description}</p>
                )}
              </div>
              <ShareButton title={`${doc.title} — Knowledge Base`} text={doc.description ?? doc.title} />
            </header>

            {/* Mobile / tablet TOC (collapsed) */}
            <details className="mb-6 rounded-md border border-border bg-card/40 px-3 py-2 text-[13px] lg:hidden">
              <summary className="cursor-pointer select-none text-muted-foreground">
                On this page
              </summary>
              <div className="mt-3">
                <Suspense fallback={null}>
                  <DocToc folder={doc.folder} file={doc.file} />
                </Suspense>
              </div>
            </details>

            <Suspense fallback={<Loader label="Loading doc" />}>
              <DocBody folder={doc.folder} file={doc.file} />
            </Suspense>

            <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-[12px] text-muted-foreground">
              <a
                href={`https://github.com/${DOCS_REPO.owner}/${DOCS_REPO.repo}/blob/${DOCS_REPO.branch}/${DOCS_REPO.basePath ? DOCS_REPO.basePath + "/" : ""}${doc.folder}/${doc.file}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 transition hover:bg-muted hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
                View on GitHub
              </a>
              <span>Loaded from GitHub</span>
            </footer>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-5 py-10">
            <Suspense fallback={null}>
              <DocToc folder={doc.folder} file={doc.file} />
            </Suspense>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>

  );
}

function DocBody({ folder, file }: { folder: string; file: string }) {
  const { data: source } = useSuspenseQuery(docQueryOptions(folder, file));
  return <Markdown source={source} />;
}

function DocToc({ folder, file }: { folder: string; file: string }) {
  const { data: source } = useSuspenseQuery(docQueryOptions(folder, file));
  return <TableOfContents items={extractToc(source)} />;
}

function DocSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-muted/60" style={{ width: `${60 + (i % 4) * 10}%` }} />
      ))}
    </div>
  );
}
