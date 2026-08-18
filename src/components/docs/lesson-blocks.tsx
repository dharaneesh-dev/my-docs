import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export function SectionBlock({
  id,
  label,
  tone = "default",
  children,
}: {
  id?: string;
  label: string;
  tone?: "default" | "formula" | "good" | "muted" | "accent";
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      data-toc-label={id ? label : undefined}
      className={cn(
        "prose-docs my-4 max-w-[760px] scroll-mt-20 rounded-lg border p-5",
        tone === "default" && "border-border bg-card",
        tone === "formula" && "border-primary/25 bg-primary/5",
        tone === "good" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "muted" && "border-border bg-muted/40",
        tone === "accent" && "border-primary/30 bg-primary/10",
      )}
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

export function ExpertNote({ children }: { children: ReactNode }) {
  return (
    <details className="my-4 max-w-[760px] rounded-lg border border-amber-500/30 bg-amber-500/5 px-5">
      <summary className="cursor-pointer list-none py-3 text-[12.5px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
        Going deeper
      </summary>
      <div className="prose-docs pb-4 pt-0">{children}</div>
    </details>
  );
}

export function Quiz({ q, a }: { q: string; a: string }) {
  return (
    <div className="my-4 max-w-[760px] rounded-lg border border-border bg-card p-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Check yourself
      </div>
      <details>
        <summary className="cursor-pointer text-[14px] font-medium text-primary">{q}</summary>
        <p className="mt-2 text-[13.5px] text-muted-foreground">{a}</p>
      </details>
    </div>
  );
}

export function Pitfall({ children }: { children: ReactNode }) {
  return (
    <div className="prose-docs my-4 max-w-[760px] rounded-lg border border-red-500/30 bg-red-500/5 p-5">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
        Common mistakes
      </div>
      {children}
    </div>
  );
}

export function CodeExample({
  id,
  title,
  code,
  lang,
  children,
}: {
  id?: string;
  title: string;
  code: string;
  lang?: string;
  children?: ReactNode;
}) {
  return (
    <div
      id={id}
      data-toc-label={id ? title : undefined}
      className="prose-docs my-4 max-w-[760px] scroll-mt-20 rounded-lg border border-border bg-card p-5"
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
      <CodeBlock code={code} lang={lang} />
    </div>
  );
}

export function Takeaway({ children }: { children: ReactNode }) {
  return (
    <div className="prose-docs my-5 max-w-[760px] rounded-r-lg border-l-4 border-primary bg-primary/10 py-3 pl-4 pr-4">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        Key takeaway
      </div>
      {children}
    </div>
  );
}

export function DiagramBlock({
  id,
  title,
  caption,
  children,
}: {
  id?: string;
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <figure
      id={id}
      data-toc-label={id ? title : undefined}
      className="my-4 max-w-[760px] scroll-mt-20 rounded-lg border border-border bg-card p-5 text-center"
    >
      <figcaption className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </figcaption>
      {children}
      {caption && <p className="mt-3 text-[12.5px] text-muted-foreground">{caption}</p>}
    </figure>
  );
}
