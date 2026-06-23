"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  FilterX,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

import { useGetLinktreeListQuery, useDeleteLinktreeMutation, Linktree } from "@/features/api/linktreeApi";

const LIMIT = 10;

function getPublicUrl(slug: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/link/${slug}`;
  }
  return `/link/${slug}`;
}

export default function LinktreeListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteItem, setDeleteItem] = useState<Linktree | null>(null);

  // Queries & Mutations
  const { data, isLoading, isFetching, refetch } = useGetLinktreeListQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
  });

  const [deleteLinktree, { isLoading: isDeleting }] = useDeleteLinktreeMutation();

  const records = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;

  const hasFilter = !!search;

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
    setPage(1);
  };

  const handleCopy = (slug: string) => {
    const url = getPublicUrl(slug);
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Tautan Linktree berhasil disalin!", { description: url });
    });
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteLinktree(deleteItem.id).unwrap();
      toast.success("Halaman Linktree berhasil dihapus");
      setDeleteItem(null);
    } catch {
      toast.error("Gagal menghapus Linktree");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Linktree" />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Linktree Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Buat dan kelola halaman profil mikro yang menyatukan semua tautan penting Anda.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/linktree/create")}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Plus className="size-4" /> Buat Halaman Baru
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari judul atau slug..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
            />
          </div>

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
            {isLoading ? "..." : total} Halaman
          </Badge>
        </div>

        {/* Grid List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center border border-dashed border-border/60 rounded-2xl bg-card/20">
            <FolderTree className="size-16 text-muted-foreground/30 animate-pulse" />
            <p className="font-semibold text-foreground">Belum ada Linktree</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {hasFilter ? "Tidak ada halaman yang cocok dengan kata kunci pencarian." : "Mulai buat halaman linktree pertama Anda untuk organisasi."}
            </p>
            {!hasFilter && (
              <Button size="sm" onClick={() => router.push("/dashboard/linktree/create")} className="mt-2">
                Buat Halaman Pertama
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((item) => (
              <Card
                key={item.id}
                className="group border-border/50 bg-card/60 backdrop-blur shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.foto_profil_url ? (
                        <div className="size-10 rounded-full border overflow-hidden bg-muted shrink-0">
                          <img src={item.foto_profil_url} alt={item.judul} className="object-cover size-full" />
                        </div>
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {item.judul.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">{item.judul}</h3>
                        <p className="text-xs text-muted-foreground truncate">/{item.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.aktif ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Nonaktif
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-5 py-3 space-y-3">
                  {item.bio && <p className="text-xs text-muted-foreground line-clamp-2">{item.bio}</p>}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] text-zinc-500 border-border/60">
                      Tema: <span className="capitalize font-semibold text-foreground ml-1">{item.tema}</span>
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-zinc-500 border-border/60">
                      Tautan: <span className="font-semibold text-foreground ml-1">{(item as any).jumlah_link || 0} link</span>
                    </Badge>
                  </div>
                </CardContent>

                <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(new Date(item.dibuat_pada), "dd MMM yyyy", { locale: localeId })}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full"
                      onClick={() => handleCopy(item.slug)}
                      title="Salin Tautan"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full"
                      onClick={() => window.open(getPublicUrl(item.slug), "_blank")}
                      title="Buka Halaman"
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full"
                      onClick={() => router.push(`/dashboard/linktree/${item.id}/edit`)}
                      title="Edit Halaman"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                      onClick={() => setDeleteItem(item)}
                      title="Hapus"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
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

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Halaman Linktree?</AlertDialogTitle>
            <AlertDialogDescription>
              Halaman Linktree <span className="font-semibold text-foreground">&ldquo;{deleteItem?.judul}&rdquo;</span> (/{deleteItem?.slug}) akan dihapus permanen. Pengguna tidak akan dapat mengakses halaman ini lagi.
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
