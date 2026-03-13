import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { SkalaPerusahaanTable } from "@/components/organisms/tables/sponsorship/SkalaPerusahaanTable";

export const metadata: Metadata = {
  title: "Alat Internal - Sponsorship - Skala Perusahaan",
};

export default function SkalaPerusahaanPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Alat Internal / Sponsorship / Skala Perusahaan" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Skala Perusahaan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola master data skala perusahaan (misal: Mikro, Kecil, Menengah).
              </p>
            </div>
          </div>

          <SkalaPerusahaanTable />
        </section>
      </div>
    </div>
  );
}
