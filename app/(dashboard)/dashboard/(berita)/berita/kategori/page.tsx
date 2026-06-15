import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { KategoriBeritaTable } from "@/components/organisms/tables/KategoriBeritaTable";

export const metadata: Metadata = {
  title: "Kategori Berita",
};

export default function KategoriBeritaPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Berita / Kategori" />
      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Kategori Berita</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola kategori untuk mengelompokkan dan mengorganisasi berita di portal publik.
              </p>
            </div>
          </div>
          <KategoriBeritaTable />
        </section>
      </div>
    </div>
  );
}
