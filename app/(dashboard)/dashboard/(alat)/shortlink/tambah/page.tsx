"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Link2, Calendar, FileText, LayoutGrid, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { useCreateShortlinkMutation } from "@/features/api/shortlinkApi";
import { schemaCreateShortlink } from "@/lib/validations/shortlink.schema";

export default function TambahShortlinkPage() {
  const router = useRouter();
  const [createShortlink, { isLoading }] = useCreateShortlinkMutation();

  // Form State
  const [judul, setJudul] = useState("");
  const [urlTujuan, setUrlTujuan] = useState("");
  const [slug, setSlug] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [isAktif, setIsAktif] = useState(true);
  const [kedaluwarsaPada, setKedaluwarsaPada] = useState("");

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getDomainName = () => {
    if (typeof window !== "undefined") {
      return `${window.location.host}/s/`;
    }
    return "/s/";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Prepare payload
    // If kedaluwarsaPada is selected, convert to ISO datetime string
    let formattedDate = "";
    if (kedaluwarsaPada) {
      try {
        formattedDate = new Date(kedaluwarsaPada).toISOString();
      } catch (err) {
        toast.error("Tanggal kedaluwarsa tidak valid");
        return;
      }
    }

    const payload = {
      judul,
      url_tujuan: urlTujuan,
      slug: slug || undefined,
      deskripsi: deskripsi || undefined,
      is_aktif: isAktif,
      kedaluwarsa_pada: formattedDate || undefined,
    };

    // Client-side validation using Zod
    const validation = schemaCreateShortlink.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Validasi gagal", {
        description: validation.error.issues[0].message,
      });
      return;
    }

    try {
      await createShortlink(payload).unwrap();
      toast.success("Shortlink berhasil dibuat!");
      router.push("/dashboard/shortlink");
    } catch (err: any) {
      const errMsg = err?.data?.message || "Gagal membuat shortlink";
      toast.error(errMsg);
      if (err?.data?.code === "SLUG_CONFLICT") {
        setErrors((prev) => ({ ...prev, slug: errMsg }));
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Shortlink / Tambah" />

      <div className="flex flex-col gap-6 p-6 max-w-4xl w-full mx-auto">
        {/* Navigation back */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/shortlink")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-4 mr-1" /> Kembali ke Daftar
          </Button>
        </div>

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Buat Shortlink Baru</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Singkatkan URL panjang organisasi Anda menjadi link pendek yang mudah diingat dan dilacak.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="size-5 text-primary animate-pulse" /> Informasi Shortlink
            </CardTitle>
            <CardDescription>
              Isi data di bawah ini untuk membuat link pendek. Kolom bertanda bintang (*) wajib diisi.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Judul */}
              <div className="space-y-2">
                <Label htmlFor="judul" className="font-semibold flex items-center gap-1.5">
                  Judul Shortlink <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="judul"
                  placeholder="Contoh: Formulir Pendaftaran Event Pemuda 2026"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className={`bg-muted/30 focus-visible:ring-primary/40 ${errors.judul ? "border-red-500" : ""}`}
                />
                {errors.judul ? (
                  <p className="text-xs text-red-500 font-medium">{errors.judul}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Judul ini digunakan untuk mengenali shortlink pada dashboard.
                  </p>
                )}
              </div>

              {/* URL Tujuan */}
              <div className="space-y-2">
                <Label htmlFor="url_tujuan" className="font-semibold flex items-center gap-1.5">
                  URL Tujuan / Link Asli <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="url_tujuan"
                  type="url"
                  placeholder="Contoh: https://docs.google.com/forms/d/xxxxxx"
                  value={urlTujuan}
                  onChange={(e) => setUrlTujuan(e.target.value)}
                  className={`bg-muted/30 focus-visible:ring-primary/40 ${errors.url_tujuan ? "border-red-500" : ""}`}
                />
                {errors.url_tujuan ? (
                  <p className="text-xs text-red-500 font-medium">{errors.url_tujuan}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Link asli yang akan dituju ketika pengguna mengakses shortlink (harus diawali http:// atau https://).
                  </p>
                )}
              </div>

              {/* Custom Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="font-semibold flex items-center gap-1.5">
                  Custom Slug / Kode Pendek
                </Label>
                <div className="flex items-center">
                  <span className="inline-flex items-center h-10 px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-mono select-none">
                    {getDomainName()}
                  </span>
                  <Input
                    id="slug"
                    placeholder="seminar-pemuda"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                    className={`rounded-l-none bg-muted/30 focus-visible:ring-primary/40 font-mono ${errors.slug ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.slug ? (
                  <p className="text-xs text-red-500 font-medium">{errors.slug}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Hanya boleh berisi huruf kecil, angka, dan tanda hubung (-). Biarkan kosong jika ingin slug di-generate secara acak oleh sistem.
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="deskripsi" className="font-semibold flex items-center gap-1.5">
                  Deskripsi <span className="text-muted-foreground font-normal text-xs">(Opsional)</span>
                </Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Tambahkan catatan atau deskripsi singkat mengenai link pendek ini..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className={`bg-muted/30 focus-visible:ring-primary/40 min-h-[90px] ${errors.deskripsi ? "border-red-500" : ""}`}
                />
                {errors.deskripsi ? (
                  <p className="text-xs text-red-500 font-medium">{errors.deskripsi}</p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Catatan internal untuk menjelaskan tujuan pembuatan shortlink ini.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-border/40">
                {/* Tanggal Kedaluwarsa */}
                <div className="space-y-2">
                  <Label htmlFor="kedaluwarsa_pada" className="font-semibold flex items-center gap-1.5">
                    Tanggal Kedaluwarsa <span className="text-muted-foreground font-normal text-xs">(Opsional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="kedaluwarsa_pada"
                      type="datetime-local"
                      value={kedaluwarsaPada}
                      onChange={(e) => setKedaluwarsaPada(e.target.value)}
                      className="bg-muted/30 focus-visible:ring-primary/40"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Shortlink secara otomatis tidak akan bisa diakses setelah waktu yang ditentukan terlewati. Biarkan kosong agar link aktif selamanya.
                  </p>
                </div>

                {/* Status Aktif */}
                <div className="space-y-3 flex flex-col justify-start">
                  <Label htmlFor="is_aktif" className="font-semibold">
                    Status Aktif
                  </Label>
                  <div className="flex items-center gap-3 bg-muted/20 border border-border/40 p-3 rounded-lg">
                    <Switch
                      id="is_aktif"
                      checked={isAktif}
                      onCheckedChange={setIsAktif}
                    />
                    <div className="grid gap-0.5">
                      <p className="text-xs font-semibold text-foreground">
                        {isAktif ? "Aktif & Dapat Diakses" : "Nonaktif (404)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {isAktif
                          ? "Pengguna yang mengklik shortlink akan langsung diarahkan ke URL tujuan."
                          : "Pengguna akan diarahkan ke halaman tidak ditemukan (404)."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/shortlink")}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2 shadow-md shadow-primary/10">
                {isLoading ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save className="size-4" /> Simpan Shortlink
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
