"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { FormQrCode } from "@/components/organisms/forms/FormQrCode";

export default function CreateQrCodePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / QR Code / Buat" />

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Buat QR Code Baru</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Buat QR Code untuk URL website, wifi, teks bebas, email, nomor telepon, atau kartu nama dengan mudah.
          </p>
        </div>

        {/* Form component */}
        <FormQrCode />
      </div>
    </div>
  );
}
