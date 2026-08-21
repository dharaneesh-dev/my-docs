import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ChevronRight, ArrowLeft, FileText } from "lucide-react";
import {
  enabledChapters,
  enabledLessons,
  type ChapterContent,
  type LessonMeta,
} from "@/content/registry";
import { cn } from "@/lib/utils";

const INDENT_PX = 14;
const STORAGE_PREFIX = "sidebar:open:";

function LucideByName({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && (Icons as unknown as Record<string, typeof FileText>)[name]) || FileText;
  return <Cmp className={className} />;
}

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const allChapters = enabledChapters();
  // Only the chapter the current page belongs to appears in the sidebar at all — other
  // chapters aren't shown even collapsed. Falls back to every chapter on pages with no
  // active lesson (e.g. this component isn't actually mounted on the home page, but this
  // keeps the component safe to reuse anywhere in the future).
  const activeChapter = allChapters.find((c) =>
    enabledLessons(c).some((l) => pathname === `/notes/u/${c.id}/${l.slug}`),
  );
  const chapters = activeChapter ? [activeChapter] : allChapters;

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
  // Only the chapter the current page belongs to is expanded; every other chapter always
  // starts collapsed (down to just its header) so the sidebar isn't cluttered with unrelated
  // chapters. This is intentionally NOT persisted to localStorage — a manual toggle is purely
  // ephemeral for the current page view, so navigating to a new page can't leave a chapter
  // stuck open (or stuck closed) from a stale preference set before this behavior existed.
  const [open, setOpen] = useState(containsActive);

  useEffect(() => {
    setOpen(containsActive);
  }, [containsActive]);

  const toggle = () => setOpen((v) => !v);

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
          {groupLessons(lessons).map((node) => (
            <LessonNode
              key={node.lesson.slug}
              chapter={chapter}
              node={node}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

type LessonTreeNode = { lesson: LessonMeta; children: LessonMeta[] };

/** Groups a flat lesson list purely from `number`'s dot-depth: a lesson numbered "2.1.3"
 *  nests under whichever lesson in the same list is numbered "2.1". Lessons with no
 *  matching two-segment parent (including every lesson in a flat, non-nested chapter
 *  like "1.7") come back as childless top-level nodes, so this is a no-op for chapters
 *  that don't use sub-topics at all. */
function groupLessons(lessons: LessonMeta[]): LessonTreeNode[] {
  const nodes: LessonTreeNode[] = [];
  const byNumber = new Map<string, LessonTreeNode>();
  for (const lesson of lessons) {
    const parts = lesson.number.split(".");
    if (parts.length <= 2) {
      const node: LessonTreeNode = { lesson, children: [] };
      nodes.push(node);
      byNumber.set(lesson.number, node);
    } else {
      const parent = byNumber.get(parts.slice(0, 2).join("."));
      if (parent) parent.children.push(lesson);
      else nodes.push({ lesson, children: [] });
    }
  }
  return nodes;
}

function LessonNode({
  chapter,
  node,
  pathname,
  onNavigate,
}: {
  chapter: ChapterContent;
  node: LessonTreeNode;
  pathname: string;
  onNavigate?: () => void;
}) {
  const { lesson, children } = node;
  const href = `/notes/u/${chapter.id}/${lesson.slug}`;
  const active = pathname === href;
  const containsActiveChild = children.some((c) => pathname === `/notes/u/${chapter.id}/${c.slug}`);
  const storageKey = STORAGE_PREFIX + chapter.id + ":" + lesson.slug;
  const [open, setOpen] = useState(active || containsActiveChild);

  useEffect(() => {
    if (containsActiveChild) setOpen(true);
  }, [containsActiveChild]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "1" && !open) setOpen(true);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (children.length === 0) {
    return (
      <li>
        <SidebarLink
          to="/notes/u/$folder/$slug"
          params={{ folder: chapter.id, slug: lesson.slug }}
          active={active}
          depth={1}
          onNavigate={onNavigate}
        >
          <span className="mr-1 tabular-nums opacity-55">{lesson.number}</span>
          {lesson.title}
        </SidebarLink>
      </li>
    );
  }

  return (
    <li>
      <div className="relative flex items-center">
        <SidebarLink
          to="/notes/u/$folder/$slug"
          params={{ folder: chapter.id, slug: lesson.slug }}
          active={active}
          depth={1}
          onNavigate={onNavigate}
        >
          <span className="mr-1 tabular-nums opacity-55">{lesson.number}</span>
          {lesson.title}
        </SidebarLink>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Collapse sub-topics" : "Expand sub-topics"}
          className="absolute right-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/70 hover:text-foreground"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        </button>
      </div>
      {open && (
        <ul className="space-y-0.5">
          {children.map((child) => {
            const childHref = `/notes/u/${chapter.id}/${child.slug}`;
            return (
              <li key={child.slug}>
                <SidebarLink
                  to="/notes/u/$folder/$slug"
                  params={{ folder: chapter.id, slug: child.slug }}
                  active={pathname === childHref}
                  depth={2}
                  onNavigate={onNavigate}
                >
                  <span className="mr-1 tabular-nums opacity-55">{child.number}</span>
                  {child.title}
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
