import { useState } from "react";
import { Share2, Check, Copy, Linkedin, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShareButton({ title, text }: { title?: string; text?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = title ?? "Knowledge Base | By Dharaneesh Boobalan";
  const shareText = text ?? shareTitle;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareTitle, text: shareText, url });
        setOpen(false);
      } catch {
        /* user dismissed */
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          aria-label="Share this page"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12.5px] font-medium text-foreground transition hover:bg-muted"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this page</DialogTitle>
          <DialogDescription className="truncate">{shareTitle}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-muted/40 p-1.5">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-foreground outline-none"
          />
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition hover:opacity-90"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ShareTile
            icon={<XIcon className="h-4 w-4" />}
            label="X"
            href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
          />
          <ShareTile
            icon={<RedditIcon className="h-4 w-4" />}
            label="Reddit"
            href={`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareTitle)}`}
          />
          <ShareTile
            icon={<Linkedin className="h-4 w-4" />}
            label="LinkedIn"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
          />
          <ShareTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            href={`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n\n" + url)}`}
          />
        </div>

        {typeof navigator !== "undefined" && (navigator as any).share && (
          <button
            onClick={nativeShare}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-[13px] hover:bg-muted"
          >
            <Share2 className="h-4 w-4" /> More options…
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShareTile({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center justify-center gap-1 rounded-md border border-border bg-background p-3 text-[12px] text-foreground transition hover:border-primary/40 hover:bg-muted"
    >
      <span className="grid h-7 w-7 place-items-center rounded bg-primary/10 text-primary">{icon}</span>
      {label}
    </a>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.74-6.2L4.95 22H2.19l6.98-7.97L2 2h6.96l4.29 5.67L18.244 2zm-2.38 18h1.88L7.23 4H5.27l10.594 16z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M22 12.07a2.18 2.18 0 0 0-3.7-1.56 10.7 10.7 0 0 0-5.85-1.86l1-4.7 3.27.7a1.56 1.56 0 1 0 .17-.93l-3.65-.78a.47.47 0 0 0-.56.36l-1.12 5.27a10.7 10.7 0 0 0-5.94 1.84A2.18 2.18 0 1 0 3 14.02c-.02.18-.03.36-.03.55 0 3.3 4.03 5.96 9 5.96s9-2.67 9-5.96c0-.18-.01-.36-.03-.53A2.18 2.18 0 0 0 22 12.07zM7.5 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm8.43 4.06c-1.04.78-2.5 1.18-3.93 1.18s-2.89-.4-3.93-1.18a.5.5 0 0 1 .6-.8c.84.63 2.08.98 3.33.98s2.49-.35 3.33-.98a.5.5 0 1 1 .6.8zM15 15a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}
