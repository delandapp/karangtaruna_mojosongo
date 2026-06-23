"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { FormQrCode } from "@/components/organisms/forms/FormQrCode";
import { useGetQrCodeByIdQuery } from "@/features/api/qrCodeApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditQrCodePage(props: PageProps) {
  const params = use(props.params);
  const id = Number(params.id);
  const router = useRouter();

  const { data, isLoading } = useGetQrCodeByIdQuery(id, {
    skip: isNaN(id) || id <= 0,
  });

  const qrcode = data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / QR Code / Edit" />

      <div className="flex flex-col gap-6 p-6 w-full max-w-6xl mx-auto">
        {/* Navigation back */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/qr-code")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4 mr-1" /> Kembali ke Daftar
          </Button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Desain QR Code</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Perbarui konten atau ubah warna dan logo QR Code Anda.
          </p>
        </div>

        {/* Form rendering */}
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        ) : !qrcode ? (
          <div className="text-center py-12">
            <p className="text-red-500 font-semibold">QR Code tidak ditemukan atau Anda tidak memiliki akses.</p>
          </div>
        ) : (
          <FormQrCode initialData={qrcode} />
        )}
      </div>
    </div>
  );
}
