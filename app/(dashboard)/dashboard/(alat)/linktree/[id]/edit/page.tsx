"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { FormLinktree } from "@/components/organisms/forms/FormLinktree";
import { useGetLinktreeByIdQuery } from "@/features/api/linktreeApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditLinktreePage(props: PageProps) {
  const params = use(props.params);
  const id = Number(params.id);
  const router = useRouter();

  const { data, isLoading } = useGetLinktreeByIdQuery(id, {
    skip: isNaN(id) || id <= 0,
  });

  const linktree = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Linktree / Edit" />

      <div className="flex flex-col gap-6 p-6 w-full max-w-6xl mx-auto">
        {/* Navigation back */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/linktree")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4 mr-1" /> Kembali ke Daftar
          </Button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Halaman Linktree</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Perbarui biodata profil Anda, kustomisasi pilihan tema, serta tambahkan dan reorder tautan.
          </p>
        </div>

        {/* Form Container */}
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        ) : !linktree ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold">Halaman Linktree tidak ditemukan atau Anda tidak memiliki akses.</p>
          </div>
        ) : (
          <FormLinktree initialData={linktree} />
        )}
      </div>
    </div>
  );
}
