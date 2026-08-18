import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import { enabledChapters, enabledLessons, type ChapterContent } from "@/content/registry";
import { cn } from "@/lib/utils";

const INDENT_PX = 14;
const STORAGE_PREFIX = "sidebar:open:";

function LucideByName({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && (Icons as unknown as Record<string, typeof FileText>)[name]) || FileText;
  return <Cmp className={className} />;
}

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const chapters = enabledChapters();

  return (
    <nav className="py-3 text-[13.5px]">
      <SidebarLink
        to="/"
        icon={<ArrowLeft className="h-4 w-4" />}
        active={pathname === "/"}
        onNavigate={onNavigate}
      >
        Back to home
      </SidebarLink>

      <div className="my-2 border-t border-border/70" />

      <ul className="space-y-0.5">
        {chapters.map((chapter) => (
          <ChapterSection
            key={chapter.id}
            chapter={chapter}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </nav>
  );
}

function ChapterSection({
  chapter,
  pathname,
  onNavigate,
}: {
  chapter: ChapterContent;
  pathname: string;
  onNavigate?: () => void;
}) {
  const lessons = enabledLessons(chapter);
  const containsActive = lessons.some((l) => pathname === `/notes/u/${chapter.id}/${l.slug}`);
  const storageKey = STORAGE_PREFIX + chapter.id;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "0" && !containsActive) setOpen(false);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <li>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="mt-2 flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-[12.5px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-transform",
            open && "rotate-90",
          )}
        />
        <LucideByName
          name={chapter.icon}
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80"
        />
        <span className="truncate">{chapter.label}</span>
      </button>
      {open && (
        <ul className="space-y-0.5">
          {lessons.map((lesson) => {
            const href = `/notes/u/${chapter.id}/${lesson.slug}`;
            return (
              <li key={lesson.slug}>
                <SidebarLink
                  to="/notes/u/$folder/$slug"
                  params={{ folder: chapter.id, slug: lesson.slug }}
                  active={pathname === href}
                  depth={1}
                  onNavigate={onNavigate}
                >
                  <span className="mr-1 tabular-nums opacity-55">{lesson.number}</span>
                  {lesson.title}
                </SidebarLink>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

type LinkProps = {
  to: string;
  params?: Record<string, string>;
  active: boolean;
  depth?: number;
  icon?: React.ReactNode;
  onNavigate?: () => void;
  children: React.ReactNode;
};

function SidebarLink({ to, params, active, depth = 0, icon, onNavigate, children }: LinkProps) {
  return (
    <Link
      to={to as never}
      params={params as never}
      onClick={onNavigate}
      style={{ paddingLeft: 12 + depth * INDENT_PX + (icon ? 0 : 18) }}
      className={cn(
        "relative mr-2 flex items-center gap-2 rounded-md py-1.5 pr-3 text-[13.5px] transition-colors",
        active
          ? "bg-accent/70 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {active && (
        <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r bg-primary" />
      )}
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="truncate">{children}</span>
    </Link>
  );
}
