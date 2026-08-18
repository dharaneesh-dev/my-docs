import { useEffect, useRef } from "react";

/** A diagram render function: builds/animates content into `host`, optionally returning a cleanup fn. */
export type DiagramRender = (host: HTMLDivElement) => (() => void) | void;

/** Shared React wrapper for every diagram in this chapter — mounts `render` into a plain div,
 *  and calls its cleanup function (if any) on unmount. */
export function DiagramHost({ render }: { render: DiagramRender }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const cleanup = render(host);
    return () => {
      if (typeof cleanup === "function") cleanup();
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} className="flex w-full flex-col items-center" />;
}
