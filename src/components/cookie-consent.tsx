import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { supabase } from "@/utils/supabase";

/**
 * Cookie consent banner — client-only.
 * Shows on every fresh site load (no persistent storage).
 * Writes directly to Supabase from the browser; geo lookup hits ipapi.co.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("cookie-consent-handled");
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const handle = async (consent: "all" | "necessary") => {
    setOpen(false);
    try {
      sessionStorage.setItem("cookie-consent-handled", consent);
    } catch { /* ignore */ }

    let ip: string | null = null;
    let country: string | null = null;
    let region: string | null = null;
    let city: string | null = null;

    if (consent === "all") {
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) {
          const g: any = await res.json();
          ip = g.ip ?? null;
          country = g.country_name ?? g.country ?? null;
          region = g.region ?? null;
          city = g.city ?? null;
        }
      } catch {
        /* ignore geo failures */
      }
    }

    try {
      await supabase.from("visitor_logs").insert({
        ip_address: ip,
        country,
        region,
        city,
        user_agent: navigator.userAgent,
        page_path: window.location.pathname + window.location.search,
        referrer: document.referrer || null,
        consent,
      });
    } catch (err) {
      console.error("[cookie-consent] insert failed", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-3 pb-3 sm:px-6 sm:pb-6">
      <div
        role="dialog"
        aria-label="Cookie preferences"
        className="mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:gap-4 sm:p-5"
      >
        <div className="flex items-start gap-3 sm:flex-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-[13px] leading-relaxed text-foreground">
            <p className="font-medium">We use cookies</p>
            <p className="text-muted-foreground">
              We record visit analytics (IP, approximate location, page) to improve this knowledge
              base. Choose what you're comfortable sharing.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => handle("necessary")}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-[12.5px] font-medium text-foreground transition hover:bg-muted"
          >
            Reject unnecessary
          </button>
          <button
            onClick={() => handle("all")}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            Accept all
          </button>
          <button
            onClick={() => handle("necessary")}
            aria-label="Dismiss"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
