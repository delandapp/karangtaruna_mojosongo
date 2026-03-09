import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { JabatanTable } from "@/components/organisms/tables/JabatanTable";

export const metadata: Metadata = {
  title: "Data Master - Jabatan",
};

export default function JabatanPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Data Master / Jabatan" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Daftar Jabatan
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola daftar tingkat jabatan yang tersedia di organisasi.
              </p>
            </div>
          </div>

          {/* Jabatan Table Component (Client Side) */}
          <JabatanTable />
        </section>
      </div>
    </div>
  );
}
