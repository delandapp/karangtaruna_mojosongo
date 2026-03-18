import React from "react";
import { Package2 } from "lucide-react";
import Link from "next/link";

export default function PortalSponsorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="#" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <Package2 className="h-6 w-6" />
            <span className="sr-only">Karang Taruna App</span>
          </Link>
          <Link href="/portal-sponsor" className="text-foreground transition-colors hover:text-foreground">
            Portal Sponsor
          </Link>
          <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
            Tagihan & Invoice
          </Link>
          <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
            Laporan Impact
          </Link>
        </nav>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial" />
          <div className="rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm cursor-pointer hover:bg-slate-100">
            Logout
          </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
