import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { KotaTable } from "@/components/organisms/tables/master/KotaTable";

export const metadata: Metadata = {
  title: "Data Master - Kota / Kabupaten",
};

export default function KotaPage() {
  return (
    <div className="flex flex-col h-full bg-background/50">
      <DashboardHeader breadcrumb="Data Master / Wilayah / Kota" />

      <div className="flex flex-col gap-6 p-6 flex-1 h-full overflow-y-auto w-full max-w-7xl mx-auto">
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Master Data Kota / Kabupaten
              </h2>
              <p className="text-sm text-muted-foreground w-full max-w-xl leading-relaxed">
                Kelola data wilayah tingkat kota atau kabupaten yang merujuk pada
                provinsi tertentu.
              </p>
            </div>
          </div>

          <KotaTable />
        </section>
      </div>
    </div>
  );
}
