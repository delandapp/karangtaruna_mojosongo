import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { SektorIndustriTable } from "@/components/organisms/tables/sponsorship/SektorIndustriTable";

export const metadata: Metadata = {
  title: "Alat Internal - Sponsorship - Sektor Industri",
};

export default function SektorIndustriPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Alat Internal / Sponsorship / Sektor Industri" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Sektor Industri
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola master data sektor industri untuk klasifikasi perusahaan sponsorship.
              </p>
            </div>
          </div>

          <SektorIndustriTable />
        </section>
      </div>
    </div>
  );
}
