"use client";

import { Sidebar } from "@/components/organisms/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <style>{`
        body {
          overflow: hidden;
        }
      `}</style>
      <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
