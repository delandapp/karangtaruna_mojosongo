import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Cari menu, fitur, atau data...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border-border/60 bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background"
      />
    </div>
  );
}
