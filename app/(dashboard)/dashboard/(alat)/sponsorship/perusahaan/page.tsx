import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { PerusahaanTable } from "@/components/organisms/tables/sponsorship/PerusahaanTable";

export const metadata: Metadata = {
  title: "Alat Internal - Sponsorship - Perusahaan",
};

export default function PerusahaanPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Alat Internal / Sponsorship / Perusahaan" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Data Perusahaan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola data entitas bisnis atau perusahaan untuk keperluan sponsorship Anda.
              </p>
            </div>
          </div>

          <PerusahaanTable />
        </section>
      </div>
    </div>
  );
}
