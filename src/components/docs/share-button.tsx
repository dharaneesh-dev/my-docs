import { useState } from "react";
import { toast } from "sonner";
import { Share2, Link2, Twitter, Linkedin, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShareButton({ title, text, url }: { title: string; text?: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the link — copy it from the address bar instead");
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* user cancelled the native share sheet — nothing to do */
    }
  };

  const openShareWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      e.preventDefault();
      nativeShare();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[12.5px]"
          onClick={handleTriggerClick}
          aria-label="Share this lesson"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={copyLink} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openShareWindow(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
            )
          }
          className="gap-2"
        >
          <Twitter className="h-4 w-4" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openShareWindow(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            )
          }
          className="gap-2"
        >
          <Linkedin className="h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            (window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text ? text + "\n\n" : ""}${url}`)}`)
          }
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Share via email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
