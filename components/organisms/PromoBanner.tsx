import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  className?: string;
}

export function PromoBanner({ className }: PromoBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-r from-primary via-violet-600 to-fuchsia-600",
        "px-6 py-4",
        className,
      )}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-4 -bottom-6 size-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Sparkles className="size-3" />
            Info Terbaru
          </div>
          <span className="text-sm font-medium text-white/90">
            Musyawarah besar Karang Taruna akan diadakan pada 15 Maret 2026.
          </span>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
        >
          Selengkapnya
        </button>
      </div>
    </div>
  );
}
