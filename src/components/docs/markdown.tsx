import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { CodeBlock } from "./code-block";
import { DiagramEmbed } from "./diagram-embed";
import { ImageZoom } from "./image-zoom";

// Match a single-line iframe or <DiagramEmbed> tag (self-closing or paired).
const EMBED_RE =
  /^[ \t]*<(?:iframe|DiagramEmbed)\b([^>]*?)(?:\/>|>\s*<\/(?:iframe|DiagramEmbed)>)[ \t]*$/gim;

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) out[m[1].toLowerCase()] = m[2];
  return out;
}

function MarkdownChunk({ source }: { source: string }) {
  if (!source.trim()) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSlug]}
      components={{
        img: ({ node, ...props }) => <ImageZoom {...(props as any)} />,
        code({ className, children, ...props }: any) {
          const text = String(children ?? "").replace(/\n$/, "");
          const lang = /language-(\w+)/.exec(className || "")?.[1];
          const isBlock = Boolean(lang) || text.includes("\n");
          if (!isBlock) {
            return <code className={className} {...props}>{children}</code>;
          }
          return <CodeBlock code={text} lang={lang} />;
        },
        table: ({ children, ...props }: any) => (
          <div className="w-full overflow-x-auto">
            <table {...props}>{children}</table>
          </div>
        ),
        pre({ children }: any) {
          return <>{children}</>;
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );
}

export function Markdown({ source }: { source: string }) {
  // Split on embed lines and render each segment as plain markdown,
  // interleaved with real <DiagramEmbed> components. Avoids rehype-raw,
  // which mis-parses iframe content (raw-text element) and swallows
  // every heading and paragraph that follows.
  const parts: Array<{ kind: "md"; value: string } | { kind: "embed"; attrs: Record<string, string> }> = [];
  let last = 0;
  EMBED_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EMBED_RE.exec(source))) {
    if (m.index > last) parts.push({ kind: "md", value: source.slice(last, m.index) });
    parts.push({ kind: "embed", attrs: parseAttrs(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < source.length) parts.push({ kind: "md", value: source.slice(last) });

  return (
    <div className="prose-docs">
      {parts.map((p, i) =>
        p.kind === "md" ? (
          <MarkdownChunk key={i} source={p.value} />
        ) : (
          <DiagramEmbed
            key={i}
            src={p.attrs.src}
            title={p.attrs.title}
            height={p.attrs.height ? Number(p.attrs.height.replace("px", "")) : undefined}
          />
        )
      )}
    </div>
  );
}
