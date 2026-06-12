import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import { manifestQueryOptions, type DocNode } from "@/lib/docs-remote";
import { cn } from "@/lib/utils";

function LucideByName({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && (Icons as any)[name]) || FileText;
  return <Cmp className={className} />;
}

/* ------------------------------------------------------------------ */
/* Tuning                                                              */
/* ------------------------------------------------------------------ */
const INDENT_PX = 14;
const ROW_PADDING_Y = "py-1.5";
const STORAGE_PREFIX = "sidebar:open:";

/* ------------------------------------------------------------------ */

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data, isLoading, error } = useQuery(manifestQueryOptions);

  return (
    <nav className="py-3 text-[13.5px]">
      <SidebarLink
        to="/"
        icon={<ArrowLeft className="h-4 w-4" />}
        active={pathname === "/"}
        depth={0}
        onNavigate={onNavigate}
      >
        Back to home
      </SidebarLink>

      <div className="my-2 border-t border-border/70" />

      {isLoading && (
        <div className="space-y-1.5 px-3 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-muted/60" />
          ))}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 text-[12px] text-destructive">
          Failed to load docs index.
        </div>
      )}

      {data && (
        <ul className="space-y-0.5">
          {data.tree.map((node, i) => (
            <SidebarNode
              key={nodeKey(node, i)}
              node={node}
              depth={0}
              pathname={pathname}
              parentPath=""
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </nav>
  );
}

function SidebarNode({
  node,
  depth,
  pathname,
  parentPath,
  onNavigate,
}: {
  node: DocNode;
  depth: number;
  pathname: string;
  parentPath: string;
  onNavigate?: () => void;
}) {
  if (node.kind === "doc") {
    const href = `/docs/${node.folder}/${node.slug}`;
    return (
      <li>
        <SidebarLink
          to="/docs/$folder/$slug"
          params={{ folder: node.folder, slug: node.slug }}
          active={pathname === href}
          depth={depth}
          icon={<LucideByName name={node.icon} className="h-4 w-4" />}
          onNavigate={onNavigate}
        >
          {node.title}
        </SidebarLink>
      </li>
    );
  }

  const path = `${parentPath}/${node.label}`;
  const containsActive = sectionContains(node, pathname);
  return (
    <li>
      <Section
        label={node.label}
        icon={node.icon}
        depth={depth}
        storageKey={STORAGE_PREFIX + path}
        defaultOpen={containsActive || Boolean(node.defaultOpen)}
        forceOpen={containsActive}
      >
        <ul className="space-y-0.5">
          {node.children.map((child, i) => (
            <SidebarNode
              key={nodeKey(child, i)}
              node={child}
              depth={depth + 1}
              pathname={pathname}
              parentPath={path}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </Section>
    </li>
  );
}

function Section({
  label,
  icon,
  depth,
  defaultOpen,
  forceOpen,
  storageKey,
  children,
}: {
  label: string;
  icon?: string;
  depth: number;
  defaultOpen: boolean;
  forceOpen: boolean;
  storageKey: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "1") setOpen(true);
      else if (v === "0" && !forceOpen) setOpen(false);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try { localStorage.setItem(storageKey, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        style={{ paddingLeft: 12 + depth * INDENT_PX }}
        className={cn(
          "group flex w-full items-center gap-1.5 pr-3 text-left text-[12.5px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
          ROW_PADDING_Y,
          depth === 0 ? "mt-2" : "mt-0.5",
        )}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform",
            open && "rotate-90",
          )}
        />
        {icon && <LucideByName name={icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />}
        <span className="truncate">{label}</span>
      </button>
      {open && (
        <div className="relative ml-0">
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-border/60"
            style={{ left: 12 + depth * INDENT_PX + 6 }}
          />
          {children}
        </div>
      )}
    </div>
  );
}

type LinkProps = {
  to: string;
  params?: Record<string, string>;
  active: boolean;
  depth: number;
  icon?: React.ReactNode;
  onNavigate?: () => void;
  children: React.ReactNode;
};

function SidebarLink({ to, params, active, depth, icon, onNavigate, children }: LinkProps) {
  return (
    <Link
      to={to as never}
      params={params as never}
      onClick={onNavigate}
      style={{ paddingLeft: 12 + depth * INDENT_PX + (icon ? 0 : 18) }}
      className={cn(
        "relative mr-2 flex items-center gap-2 rounded-md pr-3 text-[13.5px] transition-colors",
        ROW_PADDING_Y,
        active
          ? "bg-accent/70 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r bg-primary"
        />
      )}
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
}

function sectionContains(node: DocNode, pathname: string): boolean {
  if (node.kind === "doc") return pathname === `/docs/${node.folder}/${node.slug}`;
  return node.children.some((c) => sectionContains(c, pathname));
}

function nodeKey(node: DocNode, i: number): string {
  return node.kind === "doc" ? `doc:${node.folder}/${node.slug}` : `sec:${node.label}:${i}`;
}
