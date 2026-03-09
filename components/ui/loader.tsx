import { cn } from "@/lib/utils";

export function ModifiedClassicLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-primary ml-3 h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ease-linear",
        className
      )}
    ></div>
  );
}

export function ConcentricLoader() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-primary-400 text-4xl text-primary-400">
        <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-4 border-transparent border-t-secondary-400 text-2xl text-secondary-400"></div>
      </div>
    </div>
  );
}
