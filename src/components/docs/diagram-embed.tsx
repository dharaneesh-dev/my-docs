import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import { DOCS_REPO } from "../../lib/docs-remote";

function normalizeDiagramSrc(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname !== "raw.githubusercontent.com") return src;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 4) return src;

    const [owner, repo, branch, ...pathParts] = parts;
    const sameRepo =
      owner === DOCS_REPO.owner &&
      repo === DOCS_REPO.repo &&
      branch === DOCS_REPO.branch;

    if (!sameRepo) return src;

    const normalizedPathParts = [...pathParts];

    if (!DOCS_REPO.basePath && normalizedPathParts[0] === "docs") {
      normalizedPathParts.shift();
    }

    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${normalizedPathParts.join("/")}`;
  } catch {
    return src;
  }
}

export function DiagramEmbed({
  src,
  title,
  height = "auto",
}: {
  src: string;
  title?: string;
  height?: number | string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(0);
  const [iframeWidth, setIframeWidth] = useState<string>("100%");
  const resolvedSrc = normalizeDiagramSrc(src);

  // raw.githubusercontent.com serves HTML as text/plain with nosniff, so the
  // browser refuses to render it as a document via <iframe src>. Fetch it and
  // inject via srcDoc so it renders correctly.
  useEffect(() => {
    let cancelled = false;
    setSrcDoc(null);
    setError(null);
    fetch(resolvedSrc)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((html) => {
        if (!cancelled) setSrcDoc(html);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedSrc]);

  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  const handleLoad = () => {
    const iframe = ref.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      // Strip draw.io lightbox click handlers and any anchors that open a popup viewer.
      const style = doc.createElement("style");
      style.textContent = `
        a[href*="viewer.diagrams.net"], a[href*="app.diagrams.net"] { pointer-events: none !important; cursor: default !important; }
        .geDiagramContainer, .mxgraph, svg { cursor: default !important; }
        /* Hide draw.io hover tooltips / popups */
        .mxTooltip, .geTooltip, div[class*="Tooltip"],
        /* No need to force internal scrolling anymore since the iframe expands */
        html, body { overflow: hidden !important; }
        /* Cosmetically hide scrollbars without clipping content */
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      `;
      doc.head.appendChild(style);
      // Neutralize click → lightbox by capturing clicks before viewer handlers fire.
      doc.addEventListener(
        "click",
        (e) => {
          const t = e.target as HTMLElement | null;
          const a = t?.closest?.("a");
          if (a && /diagrams\.net/.test(a.getAttribute("href") || "")) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true,
      );

      let isMeasuring = false;

      // Measure content height and width by temporarily altering iframe bounds.
      // We expand width first (to prevent text wrapping from artificially increasing height),
      // then shrink height to measure true intrinsic height.
      const measureSize = () => {
        if (isMeasuring) return;
        try {
          isMeasuring = true;
          
          // Force body/html to auto height so they don't fill the viewport
          const savedBodyH = doc.body.style.height;
          const savedHtmlH = doc.documentElement.style.height;
          doc.body.style.height = "auto";
          doc.documentElement.style.height = "auto";

          // --- WIDTH MEASUREMENT ---
          // Let iframe be 100% to see if content naturally overflows
          iframe.style.width = "100%";
          void doc.body.offsetWidth; // synchronous reflow
          const contentWidth = doc.body.scrollWidth;
          const clientWidth = doc.body.clientWidth;
          
          const finalWidth = contentWidth > clientWidth ? `${contentWidth}px` : "100%";
          iframe.style.width = finalWidth;

          // --- HEIGHT MEASUREMENT ---
          // Shrink iframe to 10px so viewport-relative units collapse
          iframe.style.height = "10px";
          void doc.body.offsetHeight; // synchronous reflow
          const contentHeight = doc.body.scrollHeight;

          // Restore styles
          doc.body.style.height = savedBodyH;
          doc.documentElement.style.height = savedHtmlH;

          if (contentHeight > 10) {
            iframe.style.height = `${contentHeight}px`;
            setIframeHeight(contentHeight);
          }
          setIframeWidth(finalWidth);

        } catch {
          /* cross-origin — ignore */
        } finally {
          // Allow observers time to ignore the immediate DOM changes we just made
          requestAnimationFrame(() => {
            isMeasuring = false;
          });
        }
      };

      // Content may render asynchronously (draw.io, CSS animations, etc.)
      // Poll at increasing intervals to catch the final height.
      const intervals = [0, 100, 300, 600, 1000, 1500, 2000, 3000, 5000];
      const timers = intervals.map((ms) => setTimeout(measureSize, ms));

      const resizeObserver = new ResizeObserver(measureSize);
      resizeObserver.observe(doc.body);

      const mutationObserver = new MutationObserver(measureSize);
      mutationObserver.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      return () => {
        timers.forEach(clearTimeout);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    } catch {
      /* cross-origin — ignore */
    }
  };

  // Use explicit height prop as placeholder until auto-measurement kicks in
  const initialHeight = height === "auto" ? "200px" : (typeof height === "number" ? `${height}px` : height);

  return (
    <figure ref={wrapRef} className="my-5 overflow-hidden rounded-md border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="truncate font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          {title ?? resolvedSrc.split("/").pop()}
        </span>
        <button
          onClick={fullscreen}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Fullscreen"
          type="button"
        >
          <Maximize2 className="h-3 w-3" /> Fullscreen
        </button>
      </div>
      <div className="relative w-full overflow-x-auto bg-muted/30">
        {error ? (
          <div className="flex items-center justify-center p-4 text-center text-xs text-muted-foreground">
            Failed to load diagram: {error}
          </div>
        ) : (
          <iframe
            ref={ref}
            srcDoc={srcDoc ?? "<!doctype html><html><body style=\"margin:0\"></body></html>"}
            title={title ?? "Diagram"}
            onLoad={handleLoad}
            className="block border-0"
            style={{ 
              height: iframeHeight > 0 ? `${iframeHeight}px` : initialHeight,
              width: iframeWidth,
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        )}
      </div>
    </figure>
  );
}

