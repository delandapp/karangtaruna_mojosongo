"use client";

import { use } from "react";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { BeritaForm } from "@/components/organisms/forms/BeritaForm";
import { useGetBeritaByIdQuery } from "@/features/api/beritaApi";
import { Loader2, AlertCircle } from "lucide-react";

interface EditBeritaPageProps {
  params: Promise<{ id: string }>;
}

export default function BeritaEditPage({ params }: EditBeritaPageProps) {
  const { id } = use(params);
  const beritaId = Number(id);

  const { data: response, isLoading, isError } = useGetBeritaByIdQuery(beritaId, {
    skip: isNaN(beritaId),
  });

  const berita = response?.data ?? null;

  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Berita / Edit Berita" />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Edit Berita</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Perbarui konten, cover, atau informasi SEO artikel berita.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex h-60 items-center justify-center rounded-2xl border border-border/50 bg-card/50">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm">Memuat data berita...</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex h-60 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5">
            <div className="flex flex-col items-center gap-3 text-destructive">
              <AlertCircle className="h-7 w-7" />
              <p className="text-sm font-medium">Gagal memuat data berita.</p>
              <p className="text-xs text-muted-foreground">Periksa koneksi atau ID berita tidak valid.</p>
            </div>
          </div>
        )}

        {!isLoading && !isError && (
          <BeritaForm initialData={berita} />
        )}
      </div>
    </div>
  );
}
