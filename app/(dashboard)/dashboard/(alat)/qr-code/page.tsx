"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  QrCode as QrIcon,
  Download,
  Pencil,
  Trash2,
  Eye,
  FilterX,
  Calendar,
  ExternalLink,
  Wifi,
  Mail,
  Phone,
  FileText,
  User,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";

import { useGetQrCodeListQuery, useDeleteQrCodeMutation, QrCode } from "@/features/api/qrCodeApi";

const LIMIT = 12;

const TIPE_OPTIONS = [
  { value: "all", label: "Semua Tipe" },
  { value: "url", label: "URL / Website" },
  { value: "teks", label: "Teks Bebas" },
  { value: "email", label: "Email" },
  { value: "telepon", label: "Telepon" },
  { value: "wifi", label: "WiFi" },
  { value: "vcard", label: "Kartu Nama (vCard)" },
];

function getTipeIcon(tipe: string) {
  switch (tipe) {
    case "url":
      return <Link2 className="size-4 text-blue-500" />;
    case "teks":
      return <FileText className="size-4 text-amber-500" />;
    case "email":
      return <Mail className="size-4 text-emerald-500" />;
    case "telepon":
      return <Phone className="size-4 text-indigo-500" />;
    case "wifi":
      return <Wifi className="size-4 text-purple-500" />;
    case "vcard":
      return <User className="size-4 text-rose-500" />;
    default:
      return <QrIcon className="size-4 text-primary" />;
  }
}

export default function QrCodeListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tipeFilter, setTipeFilter] = useState("all");

  // State modals
  const [previewItem, setPreviewItem] = useState<QrCode | null>(null);
  const [deleteItem, setDeleteItem] = useState<QrCode | null>(null);

  // RTK Queries
  const { data, isLoading, isFetching, refetch } = useGetQrCodeListQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    tipe_konten: tipeFilter !== "all" ? tipeFilter : undefined,
  });

  const [deleteQrCode, { isLoading: isDeleting }] = useDeleteQrCodeMutation();

  const records = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;

  const hasFilter = search || tipeFilter !== "all";

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setTipeFilter("all");
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteQrCode(deleteItem.id).unwrap();
      toast.success("QR Code berhasil dihapus");
      setDeleteItem(null);
    } catch {
      toast.error("Gagal menghapus QR Code");
    }
  };

  const triggerDownload = (id: number, format: "png" | "svg") => {
    window.open(`/api/qr-code/${id}/download?format=${format}`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / QR Code" />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">QR Code Generator</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Buat dan kustomisasi kode QR berkualitas tinggi untuk berbagai kebutuhan.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/qr-code/create")}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Plus className="size-4" /> Buat QR Code Baru
          </Button>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari judul atau konten QR..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
            />
          </div>

          <Select
            value={tipeFilter}
            onValueChange={(v) => {
              setTipeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-48 bg-muted/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-muted/40 border-border/60 shrink-0"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin text-muted-foreground" : ""}`} />
          </Button>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <FilterX className="size-3.5" /> Reset filter
            </Button>
          )}

          <Badge variant="secondary" className="ml-auto text-xs px-3 py-1 bg-muted/60">
            {isLoading ? "..." : total} QR Code
          </Badge>
        </div>

        {/* QR Code Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-border/60 rounded-2xl bg-card/20">
            <QrIcon className="size-16 text-muted-foreground/30 animate-pulse" />
            <p className="font-semibold text-foreground">Belum ada QR Code</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {hasFilter ? "Tidak ada QR Code yang cocok dengan filter pencarian." : "Mulai buat QR Code pertama untuk tautan, wifi, atau kartu nama Anda."}
            </p>
            {!hasFilter && (
              <Button size="sm" onClick={() => router.push("/dashboard/qr-code/create")} className="mt-2">
                Buat QR Code Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {records.map((item) => (
              <Card
                key={item.id}
                className="group border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-0 flex flex-row items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{item.judul}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getTipeIcon(item.tipe_konten)}
                      <span className="capitalize">{item.tipe_konten}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-60 hover:opacity-100">
                        <span className="sr-only">Menu</span>
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setPreviewItem(item)}>
                        <Eye className="mr-2 size-4 text-muted-foreground" /> Preview Besar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/qr-code/${item.id}/edit`)}>
                        <Pencil className="mr-2 size-4 text-muted-foreground" /> Edit Desain
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteItem(item)}
                        className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                      >
                        <Trash2 className="mr-2 size-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                {/* QR Preview Block */}
                <CardContent className="p-5 flex justify-center items-center flex-1 min-h-[160px]">
                  <div
                    onClick={() => setPreviewItem(item)}
                    className="p-3 bg-white dark:bg-white rounded-xl shadow-xs border border-zinc-200/50 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <QRCodeSVG
                      value={item.konten}
                      size={110}
                      fgColor={item.warna_depan}
                      bgColor={item.warna_belakang}
                      level={item.level_koreksi as any}
                    />
                  </div>
                </CardContent>

                {/* Card Actions Bottom */}
                <div className="p-4 pt-0 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="size-3" />
                    {format(new Date(item.dibuat_pada), "dd MMM yyyy", { locale: localeId })}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="xs" variant="outline" className="gap-1.5 h-8 bg-background">
                        <Download className="size-3" /> Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => triggerDownload(item.id, "png")}>
                        Download PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => triggerDownload(item.id, "svg")}>
                        Download SVG
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              Halaman <span className="font-medium text-foreground">{page}</span> dari{" "}
              <span className="font-medium text-foreground">{pages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="gap-1.5 bg-background"
              >
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || isFetching}
                className="gap-1.5 bg-background"
              >
                Berikutnya <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/80 p-6 flex flex-col items-center">
          <DialogHeader className="w-full text-left">
            <DialogTitle className="text-base">{previewItem?.judul}</DialogTitle>
            <DialogDescription className="text-xs truncate">
              Konten: {previewItem?.konten}
            </DialogDescription>
          </DialogHeader>

          {previewItem && (
            <div className="my-6 p-6 bg-white rounded-2xl shadow-md border border-zinc-200">
              <QRCodeSVG
                value={previewItem.konten}
                size={220}
                fgColor={previewItem.warna_depan}
                bgColor={previewItem.warna_belakang}
                level={previewItem.level_koreksi as any}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 w-full pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" onClick={() => setPreviewItem(null)}>
              Tutup
            </Button>
            {previewItem && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Download className="size-4" /> Unduh QR Code
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => triggerDownload(previewItem.id, "png")}>
                    Unduh PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => triggerDownload(previewItem.id, "svg")}>
                    Unduh SVG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus QR Code?</AlertDialogTitle>
            <AlertDialogDescription>
              QR Code <span className="font-semibold text-foreground">&ldquo;{deleteItem?.judul}&rdquo;</span> akan dihapus dari dashboard Anda. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
