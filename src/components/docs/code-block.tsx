import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { codeToHtml } from "shiki";

export function CodeBlock({ code, lang = "python" }: { code: string; lang?: string }) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    codeToHtml(code, { lang, themes: { light: "github-light", dark: "github-dark" } })
      .then((out) => active && setHtml(out))
      .catch(() => active && setHtml(`<pre><code>${escapeHtml(code)}</code></pre>`));
    return () => {
      active = false;
    };
  }, [code, lang]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 overflow-hidden rounded-md border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border bg-background px-3 py-1.5 text-xs">
        <span className="font-mono uppercase tracking-wide text-muted-foreground">{lang}</span>
        <button
          onClick={copy}
          type="button"
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div
        className="overflow-x-auto p-3 text-[13px] [&_code]:!font-mono [&_pre]:!m-0 [&_pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html || `<pre><code>${escapeHtml(code)}</code></pre>` }}
      />
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
