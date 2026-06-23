"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Link2,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  FilterX,
  BarChart3,
  CheckCircle2,
  XCircle,
  MousePointerClick,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  useGetShortlinkListQuery,
  useDeleteShortlinkMutation,
} from "@/features/api/shortlinkApi";
import type { Shortlink } from "@/lib/types/shortlink.types";

// ── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Nonaktif" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
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

function getStatusBadge(isAktif: boolean, kedaluwarsa: string | null) {
  if (isExpired(kedaluwarsa)) {
    return (
      <Badge variant="secondary" className="text-[11px] font-semibold flex items-center w-fit bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <XCircle className="size-3 mr-1" /> Kedaluwarsa
      </Badge>
    );
  }
  if (isAktif) {
    return (
      <Badge variant="secondary" className="text-[11px] font-semibold flex items-center w-fit bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="size-3 mr-1" /> Aktif
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[11px] font-semibold flex items-center w-fit bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="size-3 mr-1" /> Nonaktif
    </Badge>
  );
}

// ── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, sub, icon: Icon, color, bgColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bgColor}`}>
        <Icon className={`size-6 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground truncate">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ShortlinkPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Shortlink | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetShortlinkListQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    is_aktif: statusFilter !== "all" ? statusFilter === "true" : undefined,
  });

  const [deleteShortlink, { isLoading: isDeleting }] = useDeleteShortlinkMutation();

  const records: Shortlink[] = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;

  // Computed summaries
  const totalAktif = records.filter((r) => r.is_aktif && !isExpired(r.kedaluwarsa_pada)).length;
  const totalKlik = records.reduce((acc, r) => acc + r.total_klik, 0);

  const hasFilter = search || statusFilter !== "all";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => { setPage(1); setSearch(searchInput); }, [searchInput]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };
  const resetFilters = () => {
    setSearch(""); setSearchInput(""); setStatusFilter("all"); setPage(1);
  };

  const handleCopy = (slug: string) => {
    const url = getShortUrl(slug);
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link berhasil disalin!", { description: url });
    });
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteShortlink(selectedItem.id).unwrap();
      toast.success("Shortlink berhasil dihapus");
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch {
      toast.error("Gagal menghapus shortlink");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Shortlink" />

      <div className="flex flex-col gap-5 p-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Shortlink</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Buat dan kelola link pendek untuk berbagai keperluan organisasi
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/shortlink/tambah")}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Plus className="size-4" /> Buat Shortlink
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Shortlink"
            value={String(total)}
            sub="Semua data link"
            icon={Link2}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <SummaryCard
            label="Link Aktif"
            value={String(totalAktif)}
            sub="Di halaman ini"
            icon={CheckCircle2}
            color="text-emerald-600"
            bgColor="bg-emerald-100 dark:bg-emerald-900/20"
          />
          <SummaryCard
            label="Total Klik"
            value={totalKlik.toLocaleString("id-ID")}
            sub="Di halaman ini"
            icon={MousePointerClick}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/20"
          />
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari judul, slug, atau URL..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-muted/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

          <Badge variant="secondary" className="ml-auto text-xs px-3 py-1">
            {isLoading ? "..." : total} shortlink
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <Link2 className="size-14 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Belum ada shortlink</p>
              <p className="text-sm text-muted-foreground">
                {hasFilter ? "Coba ubah filter pencarian." : "Mulai buat link pendek untuk organisasi."}
              </p>
              {!hasFilter && (
                <Button size="sm" onClick={() => router.push("/dashboard/shortlink/tambah")} className="mt-2 gap-2">
                  <Plus className="size-4" /> Buat Shortlink Pertama
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-5">Judul</TableHead>
                  <TableHead>Short URL</TableHead>
                  <TableHead className="hidden lg:table-cell">URL Tujuan</TableHead>
                  <TableHead className="text-center">Klik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Dibuat</TableHead>
                  <TableHead className="w-[52px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-muted/30 transition-colors ${isFetching ? "opacity-60" : ""}`}
                  >
                    <TableCell className="pl-5">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.judul}</p>
                      {item.deskripsi && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.deskripsi}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono bg-muted/60 px-2 py-0.5 rounded text-primary">
                          /s/{item.slug}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleCopy(item.slug)}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <a
                        href={item.url_tujuan}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline line-clamp-1 max-w-[260px] inline-block"
                      >
                        {item.url_tujuan}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-foreground">
                        <MousePointerClick className="size-3.5 text-blue-500" />
                        {item.total_klik.toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.is_aktif, item.kedaluwarsa_pada)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(item.dibuat_pada), "dd MMM yyyy", { locale: localeId })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleCopy(item.slug)}>
                            <Copy className="mr-2 size-4" /> Salin Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(getShortUrl(item.slug), "_blank")}>
                            <ExternalLink className="mr-2 size-4" /> Buka Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/shortlink/${item.id}`)}>
                            <Eye className="mr-2 size-4" /> Detail & Statistik
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/shortlink/${item.id}`)}>
                            <Pencil className="mr-2 size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setSelectedItem(item); setDeleteOpen(true); }}
                            className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          >
                            <Trash2 className="mr-2 size-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-1">
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
                className="gap-1.5"
              >
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || isFetching}
                className="gap-1.5"
              >
                Berikutnya <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Shortlink?</AlertDialogTitle>
            <AlertDialogDescription>
              Shortlink <span className="font-semibold text-foreground">&ldquo;{selectedItem?.judul}&rdquo;</span> akan
              dihapus. Link <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/s/{selectedItem?.slug}</code>{" "}
              tidak akan bisa diakses lagi.
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
