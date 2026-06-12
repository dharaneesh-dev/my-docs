import { Link } from "@tanstack/react-router";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";

export function TopNav({ left }: { left?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        {left}
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary text-primary-foreground text-[12px] font-bold">
            KB
          </span>
          <span className="truncate text-[18px] font-normal tracking-tight text-foreground font-display">
            Knowledge Base
          </span>
          <span className="ml-1 hidden text-[13px] text-muted-foreground sm:inline">
            / by <span className="text-foreground">Dharaneesh Boobalan</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:inline-flex"
            title="All systems operational"
          >
            <span className="live-dot" aria-hidden />
            <span>Servers normal</span>
            <span className="text-foreground">· Live</span>
          </span>
          <SearchCommand />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
