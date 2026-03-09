import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { KategoriBrandTable } from "@/components/organisms/tables/KategoriBrandTable";

export const metadata: Metadata = {
  title: "Sponsorship - Kategori Brand",
};

export default function KategoriBrandPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Sponsorship / Alat / Kategori Brand" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Daftar Kategori Brand
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola daftar kategori tingkat sponsor (Sponsor Utama, Co-Sponsor, dll).
              </p>
            </div>
          </div>

          {/* KategoriBrand Table Component (Client Side) */}
          <KategoriBrandTable />
        </section>
      </div>
    </div>
  );
}
