"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Link2,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  MousePointerClick,
  CheckCircle2,
  XCircle,
  BarChart3,
  Settings,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  useGetShortlinkByIdQuery,
  useGetShortlinkStatsQuery,
  useUpdateShortlinkMutation,
} from "@/features/api/shortlinkApi";
import { schemaUpdateShortlink } from "@/lib/validations/shortlink.schema";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Helper functions (same as list page)
function getShortUrl(slug: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/s/${slug}`;
  }
  return `/s/${slug}`;
}

function isExpired(kedaluwarsa: string | null): boolean {
  if (!kedaluwarsa) return false;
  return new Date(kedaluwarsa) < new Date();
}

export default function ShortlinkDetailPage(props: PageProps) {
  const params = use(props.params);
  const id = Number(params.id);

  const router = useRouter();

  // Queries & Mutations
  const { data: detailData, isLoading: isLoadingDetail, refetch: refetchDetail } = useGetShortlinkByIdQuery(id, {
    skip: isNaN(id) || id <= 0,
  });
  const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useGetShortlinkStatsQuery(id, {
    skip: isNaN(id) || id <= 0,
  });
  const [updateShortlink, { isLoading: isUpdating }] = useUpdateShortlinkMutation();

  const shortlink = detailData?.data;
  const stats = statsData?.data;

  // Form State
  const [judul, setJudul] = useState("");
  const [urlTujuan, setUrlTujuan] = useState("");
  const [slug, setSlug] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [isAktif, setIsAktif] = useState(true);
  const [kedaluwarsaPada, setKedaluwarsaPada] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync details to state
  useEffect(() => {
    if (shortlink) {
      setJudul(shortlink.judul);
      setUrlTujuan(shortlink.url_tujuan);
      setSlug(shortlink.slug);
      setDeskripsi(shortlink.deskripsi || "");
      setIsAktif(shortlink.is_aktif);
      
      if (shortlink.kedaluwarsa_pada) {
        // Convert to local format for datetime-local: YYYY-MM-DDThh:mm
        const date = new Date(shortlink.kedaluwarsa_pada);
        const pad = (num: number) => String(num).padStart(2, "0");
        const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        setKedaluwarsaPada(formatted);
      } else {
        setKedaluwarsaPada("");
      }
    }
  }, [shortlink]);

  if (isNaN(id) || id <= 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardHeader breadcrumb="Alat / Shortlink / Detail" />
        <div className="p-6 text-center">
          <p className="text-red-500 font-semibold">ID Shortlink tidak valid</p>
        </div>
      </div>
    );
  }

  const getDomainName = () => {
    if (typeof window !== "undefined") {
      return `${window.location.host}/s/`;
    }
    return "/s/";
  };

  const handleCopy = () => {
    if (!shortlink) return;
    const url = getShortUrl(shortlink.slug);
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link berhasil disalin!", { description: url });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

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
      slug,
      deskripsi: deskripsi || undefined,
      is_aktif: isAktif,
      kedaluwarsa_pada: formattedDate || "",
    };

    // Validate using Zod
    const validation = schemaUpdateShortlink.safeParse(payload);
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
      await updateShortlink({ id, ...payload }).unwrap();
      toast.success("Shortlink berhasil diperbarui!");
      refetchDetail();
      refetchStats();
    } catch (err: any) {
      const errMsg = err?.data?.message || "Gagal memperbarui shortlink";
      toast.error(errMsg);
      if (err?.data?.code === "SLUG_CONFLICT") {
        setErrors((prev) => ({ ...prev, slug: errMsg }));
      }
    }
  };

  // Generate complete 30 days data to fill gaps for chart
  const getChartData = () => {
    if (!stats || !stats.klik_per_hari) return [];
    const map = new Map(stats.klik_per_hari.map((d) => [d.tanggal, d.total]));
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({
        tanggal: dateStr,
        total: map.get(dateStr) || 0,
      });
    }
    return result;
  };

  const chartData = getChartData();
  const maxClicks = Math.max(...chartData.map((d) => d.total), 5);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb={`Alat / Shortlink / Detail`} />

      <div className="flex flex-col gap-6 p-6 max-w-5xl w-full mx-auto">
        {/* Navigation back and status header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/shortlink")}
            className="text-muted-foreground hover:text-foreground w-fit"
          >
            <ChevronLeft className="size-4 mr-1" /> Kembali ke Daftar
          </Button>

          {shortlink && (
            <div className="flex items-center gap-2">
              {isExpired(shortlink.kedaluwarsa_pada) ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <XCircle className="size-3 mr-1" /> Kedaluwarsa
                </Badge>
              ) : shortlink.is_aktif ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="size-3 mr-1" /> Aktif
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle className="size-3 mr-1" /> Nonaktif
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Shortlink Banner Card */}
        {isLoadingDetail ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : !shortlink ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Shortlink tidak ditemukan</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card/65 backdrop-blur p-6 flex flex-col md:flex-row justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{shortlink.judul}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Link2 className="size-3.5 text-primary" />
                  Target:
                  <a
                    href={shortlink.url_tujuan}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-foreground max-w-[200px] truncate"
                  >
                    {shortlink.url_tujuan}
                  </a>
                </span>
                <span>•</span>
                <span>Dibuat pada: {format(new Date(shortlink.dibuat_pada), "dd MMMM yyyy", { locale: localeId })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <div className="bg-muted/60 border border-border/50 rounded-lg p-2 flex items-center gap-1.5 font-mono text-sm">
                <span className="text-primary font-bold">/s/{shortlink.slug}</span>
              </div>
              <Button size="icon" variant="outline" onClick={handleCopy} title="Salin Link">
                <Copy className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.open(getShortUrl(shortlink.slug), "_blank")}
                title="Buka Link"
              >
                <ExternalLink className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        {shortlink && (
          <Tabs defaultValue="statistik" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-muted/60">
              <TabsTrigger value="statistik" className="gap-2">
                <BarChart3 className="size-4" /> Statistik
              </TabsTrigger>
              <TabsTrigger value="pengaturan" className="gap-2">
                <Settings className="size-4" /> Pengaturan
              </TabsTrigger>
            </TabsList>

            {/* Statistik Tab Content */}
            <TabsContent value="statistik" className="space-y-6 outline-none">
              {isLoadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              ) : !stats ? (
                <div className="text-center py-8">Gagal memuat data statistik</div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-border/40 bg-card/40 p-4">
                      <CardDescription className="text-xs">Total Klik</CardDescription>
                      <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                        <MousePointerClick className="size-5 text-blue-500" />
                        {stats.total_klik.toLocaleString("id-ID")}
                      </CardTitle>
                    </Card>

                    <Card className="border-border/40 bg-card/40 p-4">
                      <CardDescription className="text-xs">Klik Hari Ini</CardDescription>
                      <CardTitle className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                        <TrendingUp className="size-5 text-emerald-500" />
                        {stats.klik_hari_ini.toLocaleString("id-ID")}
                      </CardTitle>
                    </Card>

                    <Card className="border-border/40 bg-card/40 p-4">
                      <CardDescription className="text-xs">7 Hari Terakhir</CardDescription>
                      <CardTitle className="text-2xl font-bold text-foreground mt-1">
                        {stats.klik_7_hari.toLocaleString("id-ID")}
                      </CardTitle>
                    </Card>

                    <Card className="border-border/40 bg-card/40 p-4">
                      <CardDescription className="text-xs">30 Hari Terakhir</CardDescription>
                      <CardTitle className="text-2xl font-bold text-foreground mt-1">
                        {stats.klik_30_hari.toLocaleString("id-ID")}
                      </CardTitle>
                    </Card>
                  </div>

                  {/* Chart Card */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="size-4 text-primary" /> Tren Klik (30 Hari Terakhir)
                      </CardTitle>
                      <CardDescription>Visualisasi jumlah klik link pendek per hari</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {chartData.length === 0 ? (
                        <div className="h-[250px] flex items-center justify-center border border-dashed border-border rounded-xl">
                          <p className="text-sm text-muted-foreground">Belum ada data klik.</p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Y-axis Labels */}
                          <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-[10px] text-muted-foreground select-none font-mono text-right pr-2">
                            <span>{maxClicks}</span>
                            <span>{Math.round(maxClicks * 0.67)}</span>
                            <span>{Math.round(maxClicks * 0.33)}</span>
                            <span>0</span>
                          </div>

                          {/* Chart SVG */}
                          <div className="pl-10 h-[220px]">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {/* Horizontal lines */}
                              <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="1 1" />
                              <line x1="0" y1="33" x2="100" y2="33" stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="1 1" />
                              <line x1="0" y1="67" x2="100" y2="67" stroke="currentColor" className="text-border" strokeWidth="0.2" strokeDasharray="1 1" />
                              <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" className="text-border" strokeWidth="0.2" />

                              {/* SVG path calculations */}
                              {(() => {
                                const pts = chartData.map((d, i) => {
                                  const x = (i / (chartData.length - 1)) * 100;
                                  const y = 100 - (d.total / maxClicks) * 100;
                                  return { x, y };
                                });

                                const linePath = pts.reduce((acc, p, i) => acc + `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
                                const areaPath = `${linePath} L 100 100 L 0 100 Z`;

                                return (
                                  <>
                                    <path d={areaPath} fill="url(#chartGrad)" />
                                    <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                  </>
                                );
                              })()}
                            </svg>
                          </div>

                          {/* X-axis Labels */}
                          <div className="pl-10 flex justify-between text-[9px] text-muted-foreground mt-2 font-mono">
                            <span>{format(new Date(chartData[0].tanggal), "dd MMM")}</span>
                            <span>{format(new Date(chartData[9].tanggal), "dd MMM")}</span>
                            <span>{format(new Date(chartData[19].tanggal), "dd MMM")}</span>
                            <span>{format(new Date(chartData[29].tanggal), "dd MMM")}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Daily breakdown table */}
                  <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base">Tabel Klik Harian</CardTitle>
                      <CardDescription>Rincian data jumlah klik per hari</CardDescription>
                    </CardHeader>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="pl-6">Tanggal</TableHead>
                          <TableHead className="text-right pr-6">Jumlah Klik</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.klik_per_hari.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-6 text-muted-foreground text-sm">
                              Belum ada data klik terekam
                            </TableCell>
                          </TableRow>
                        ) : (
                          stats.klik_per_hari
                            .slice()
                            .reverse()
                            .map((row) => (
                              <TableRow key={row.tanggal}>
                                <TableCell className="pl-6 font-medium">
                                  {format(new Date(row.tanggal), "dd MMMM yyyy", { locale: localeId })}
                                </TableCell>
                                <TableCell className="text-right pr-6 font-bold text-foreground">
                                  {row.total.toLocaleString("id-ID")} klik
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Pengaturan/Edit Tab Content */}
            <TabsContent value="pengaturan" className="outline-none">
              <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="size-5 text-primary" /> Pengaturan Shortlink
                  </CardTitle>
                  <CardDescription>
                    Perbarui informasi shortlink di bawah ini. Kolom bertanda bintang (*) wajib diisi.
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
                        Custom Slug / Kode Pendek <span className="text-red-500">*</span>
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
                          Hanya boleh berisi huruf kecil, angka, dan tanda hubung (-).
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
                      disabled={isUpdating}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isUpdating} className="gap-2 shadow-md shadow-primary/10">
                      {isUpdating ? (
                        "Menyimpan..."
                      ) : (
                        <>
                          <Save className="size-4" /> Simpan Perubahan
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
