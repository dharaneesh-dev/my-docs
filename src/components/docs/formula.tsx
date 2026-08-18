import { useMemo } from "react";
import katex from "katex";

export function Formula({ children, display = true }: { children: string; display?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: display, throwOnError: false });
    } catch {
      return children;
    }
  }, [children, display]);

  if (!display) {
    return <span className="text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className="my-2 overflow-x-auto text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
