import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function ImageZoom(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        {...props}
        className="my-4 h-auto max-w-full cursor-zoom-in rounded-lg border border-border"
        onClick={() => setOpen(true)}
        loading="lazy"
        alt={props.alt ?? ""}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] border-border bg-card p-2 sm:max-w-5xl">
          <img src={props.src} alt={props.alt ?? ""} className="h-auto w-full rounded-md" />
        </DialogContent>
      </Dialog>
    </>
  );
}
