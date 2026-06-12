import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/docs/top-nav";
import { SiteFooter } from "@/components/docs/site-footer";
import { Loader } from "@/components/docs/loader";
import { manifestQueryOptions } from "@/lib/docs-remote";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { AIBrainLogo } from "@/components/docs/ai-brain-logo";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Knowledge Base | By Dharaneesh Boobalan" },
      { name: "description", content: "Engineering knowledge base spanning ML, inference, agentic AI, systems, and rocket science — by Dharaneesh Boobalan." },
      { property: "og:title", content: "Knowledge Base | By Dharaneesh Boobalan" },
      { property: "og:description", content: "Engineering knowledge base spanning ML, inference, agentic AI, systems, and rocket science." },
      { property: "og:url", content: "https://docs.dharaneesh.in/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Knowledge Base | By Dharaneesh Boobalan" },
      { name: "twitter:description", content: "Engineering knowledge base spanning ML, inference, agentic AI, systems, and rocket science." },
    ],
    links: [{ rel: "canonical", href: "https://docs.dharaneesh.in/" }],
  }),
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(manifestQueryOptions);
  },
  component: Home,
});

function Home() {
  const { data, isLoading, error } = useQuery(manifestQueryOptions);
  const first = data?.flat[0];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="border-b border-border py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="mb-4 text-[12px] font-medium uppercase tracking-wider text-primary">
                Documentation <span className="text-muted-foreground">/ by Dharaneesh Boobalan</span>
              </p>
              <h1 className="font-display text-[32px] font-normal leading-tight tracking-tight text-foreground sm:text-[42px] lg:text-[48px]">
                Engineering knowledge base
              </h1>
              <figure className="mt-6 max-w-3xl border-l-4 border-primary pl-5">
                <blockquote className="font-display text-[18px] italic leading-relaxed text-foreground sm:text-[20px]">
                  "It's important to view knowledge as a sort of semantic tree—make sure you
                  understand the fundamental principles before you get into the details."
                </blockquote>
                <figcaption className="mt-3 text-[13px] text-muted-foreground">
                  — Elon Musk
                </figcaption>
              </figure>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {first && (
                  <Link
                    to="/docs/$folder/$slug"
                    params={{ folder: first.folder, slug: first.slug }}
                    className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    Start reading <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <a
                  href="#sections"
                  className="rounded border border-border px-4 py-2 text-[13px] font-medium text-foreground transition hover:bg-muted"
                >
                  Browse all sections
                </a>
              </div>
            </div>
            <div className="hidden lg:flex">
              <div className="relative grid h-64 w-64 place-items-center overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-background shadow-lg">
                <div className="absolute h-56 w-56 rounded-full border border-primary/15" />
                <div className="absolute h-40 w-40 rounded-full border border-primary/25" />
                <div className="absolute inset-3 rounded-2xl border border-border/60" />
                <AIBrainLogo className="relative h-40 w-40 text-primary" />
              </div>
            </div>
          </div>
        </section>



        <section id="sections" className="py-12">
          <h2 className="mb-6 font-display text-[20px] font-normal text-foreground">
            All documentation
          </h2>

          {isLoading && <Loader label="Loading docs" />}

          {error && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-[13px] text-destructive">
              Couldn't load docs index from GitHub. Check the repo, branch, and config.json.
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.flat.map((d) => {
                const Icon = (Icons as any)[d.icon] ?? Icons.FileText;
                return (
                  <Link
                    key={d.key}
                    to="/docs/$folder/$slug"
                    params={{ folder: d.folder, slug: d.slug }}
                    className="card-hover group flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {d.category}
                      </span>
                    </div>
                    <h3 className="font-display text-[16px] font-medium leading-snug text-foreground">
                      {d.title}
                    </h3>
                    {d.description && (
                      <p className="text-[13px] text-muted-foreground">{d.description}</p>
                    )}
                    <div className="mt-auto inline-flex items-center gap-1 text-[13px] text-primary">
                      Open <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />

    </div>
  );
}
