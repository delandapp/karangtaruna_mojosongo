"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { FormLinktree } from "@/components/organisms/forms/FormLinktree";

export default function CreateLinktreePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Linktree / Buat" />

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Buat Halaman Linktree</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Buat halaman profil mikro baru. Setelah profil disimpan, Anda dapat mulai menambahkan link tautan.
          </p>
        </div>

        {/* Form Container */}
        <FormLinktree />
      </div>
    </div>
  );
}
