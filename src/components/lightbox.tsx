import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxItem = { src: string; alt: string; caption?: string | undefined };

// A full-screen photo viewer. Arrow keys, the on-screen arrows or a swipe move between
// photos; clicking the photo switches between fit-to-screen and actual size (handy for
// magazine pages); Esc, the close button or a click outside the photo closes it.
export function Lightbox({
  items,
  index,
  onIndexChange,
  title = "Photo",
}: {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  title?: string;
}) {
  const open = index !== null && items[index] !== undefined;
  const current = open ? items[index] : undefined;
  const count = items.length;
  const go = (step: number) => {
    if (index === null || count < 2) return;
    onIndexChange((index + step + count) % count);
  };
  const touchStart = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  // Each photo opens fitted to the screen.
  useEffect(() => setZoomed(false), [index]);

  // Load the neighbouring photos so stepping through feels instant.
  useEffect(() => {
    if (index === null || count < 2) return;
    for (const step of [1, -1]) {
      const next = items[(index + step + count) % count];
      if (next) new Image().src = next.src;
    }
  }, [index, items, count]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none sm:p-10"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
          onClick={(e) => e.target === e.currentTarget && onIndexChange(null)}
          onTouchStart={(e) => (touchStart.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (zoomed) return;
            const start = touchStart.current;
            const end = e.changedTouches[0]?.clientX;
            touchStart.current = null;
            if (start === null || end === undefined || Math.abs(end - start) < 50) return;
            go(end < start ? 1 : -1);
          }}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {current && (
            <figure
              className={cn(
                "flex max-h-full max-w-full flex-col items-center",
                zoomed && "h-[calc(100svh-6rem)] w-full",
              )}
            >
              <div className={cn(zoomed && "w-full flex-1 overflow-auto")}>
                <img
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  onClick={() => setZoomed((z) => !z)}
                  title={zoomed ? "Click to fit the screen" : "Click to see full size"}
                  className={cn(
                    "rounded-sm shadow-2xl",
                    zoomed
                      ? "mx-auto max-w-none cursor-zoom-out"
                      : "max-h-[calc(100svh-9rem)] max-w-full cursor-zoom-in object-contain",
                  )}
                />
              </div>
              <figcaption className="mt-4 flex max-w-2xl flex-col items-center gap-1 text-center text-sm text-white/85">
                {current.caption && <span>{current.caption}</span>}
                {count > 1 && (
                  <span className="font-mono text-[10px] tracking-widest text-white/55">
                    {index! + 1} / {count}
                  </span>
                )}
              </figcaption>
            </figure>
          )}
          <DialogPrimitive.Close asChild>
            <LightboxButton label="Close" className="right-3 top-3 sm:right-5 sm:top-5">
              <X />
            </LightboxButton>
          </DialogPrimitive.Close>
          {count > 1 && (
            <>
              <LightboxButton
                label="Previous photo"
                onClick={() => go(-1)}
                className="left-2 top-1/2 -translate-y-1/2 sm:left-5"
              >
                <ChevronLeft />
              </LightboxButton>
              <LightboxButton
                label="Next photo"
                onClick={() => go(1)}
                className="right-2 top-1/2 -translate-y-1/2 sm:right-5"
              >
                <ChevronRight />
              </LightboxButton>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Accepts any button props, so Radix can attach its close behaviour (and ref) to it.
function LightboxButton({
  label,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "absolute flex size-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white [&_svg]:size-6",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
