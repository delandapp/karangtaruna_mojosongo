import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { BeritaForm } from "@/components/organisms/forms/BeritaForm";

export const metadata: Metadata = {
  title: "Tulis Berita Baru",
};

export default function BeritaBuatPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Berita / Tulis Berita" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Tulis Berita Baru</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Buat artikel berita baru. Isi konten, cover, dan informasi SEO sebelum menyimpan.
            </p>
          </div>
        </div>
        <BeritaForm initialData={null} />
      </div>
    </div>
  );
}
