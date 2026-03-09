import { SearchBar } from "@/components/molecules/SearchBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Settings } from "lucide-react";

interface DashboardHeaderProps {
  breadcrumb?: string;
}

export function DashboardHeader({
  breadcrumb = "Dashboard",
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background px-6">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Halaman</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium text-foreground">{breadcrumb}</span>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        <SearchBar className="hidden w-64 md:block" />

        <ThemeToggle size="sm" />

        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Pengaturan"
        >
          <Settings className="size-4" />
        </button>

        <button
          type="button"
          className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Notifikasi"
        >
          <Bell className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <Avatar className="size-8 cursor-pointer ring-2 ring-border">
          <AvatarImage src="" alt="Admin" />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            AK
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
