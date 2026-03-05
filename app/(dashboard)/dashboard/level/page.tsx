import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import { LevelTable } from "@/components/organisms/LevelTable";

export const metadata: Metadata = {
  title: "Data Master - Level",
};

export default function LevelPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Data Master / Level" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Hak Akses Level
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola sistem hak akses level untuk membatasi kontrol user dalam
                aplikasi.
              </p>
            </div>
          </div>

          <LevelTable />
        </section>
      </div>
    </div>
  );
}
