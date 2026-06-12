import { NewsletterForm } from "./newsletter-form";
import { Github, Mail, Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <>
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="live-dot" aria-hidden />
                Newsletter
              </span>
              <h2 className="mt-3 font-display text-[24px] font-normal text-foreground sm:text-[28px]">
                Stay in the loop
              </h2>
              <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
                Subscribe to get new docs, diagrams, and engineering write-ups by
                Dharaneesh Boobalan delivered to your inbox.
              </p>
              <ul className="mt-5 space-y-2 text-[13px] text-foreground">
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> Deep-dive write-ups on ML, inference, and systems.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> New Draw.io diagrams &amp; interactive canvases.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> Agentic patterns and rocket-science notes.</li>
                <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> No spam. One tasteful email when there's something new.</li>
              </ul>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FooterLink icon={<Github className="h-4 w-4" />} label="GitHub" sub="View source" href="https://github.com/Dharaneesh0745/docs" />
                <FooterLink icon={<Mail className="h-4 w-4" />} label="Contact" sub="dharaneesh.dev@gmail.com" href="mailto:dharaneesh.dev@gmail.com" />
              </div>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Crafted by Dharaneesh Boobalan
              </p>
            </div>

            <NewsletterForm />

          </div>
        </div>
      </section>
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 text-center text-[12px] text-muted-foreground sm:px-6 lg:px-8">
          <span>Content fetched live from GitHub · Edit a .md file, push, refresh.</span>
          <span>© {new Date().getFullYear()} Dharaneesh Boobalan</span>
        </div>
      </footer>
    </>
  );
}

function FooterLink({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition hover:border-primary/40 hover:bg-background"
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-[13px] font-medium text-foreground">{label}</span>
        <span className="text-[11px] text-muted-foreground">{sub}</span>
      </span>
    </a>
  );
}
