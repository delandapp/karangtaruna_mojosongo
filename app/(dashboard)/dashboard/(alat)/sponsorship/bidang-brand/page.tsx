import React from "react";
import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { BidangBrandTable } from "@/components/organisms/tables/BidangBrandTable";

export const metadata: Metadata = {
  title: "Sponsorship - Bidang Brand",
};

export default function BidangBrandPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Sponsorship / Alat / Bidang Brand" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Daftar Bidang Brand
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola daftar bidang industri brand untuk keperluan sponsorship.
              </p>
            </div>
          </div>

          {/* BidangBrand Table Component (Client Side) */}
          <BidangBrandTable />
        </section>
      </div>
    </div>
  );
}
