import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { BeritaTable } from "@/components/organisms/tables/BeritaTable";

export const metadata: Metadata = {
  title: "Manajemen Berita",
};

export default function BeritaPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Berita / Manajemen Berita" />
      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Manajemen Berita</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola artikel berita: tulis, edit, publish, dan arsipkan berita untuk portal publik.
              </p>
            </div>
          </div>
          <BeritaTable />
        </section>
      </div>
    </div>
  );
}
