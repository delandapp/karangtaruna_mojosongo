"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ExternalLink,
  FilterX,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

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
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";

import {
  useGetKasListQuery,
  type Kas,
} from "@/features/api/keuanganApi";
import { KasFormModal } from "@/components/organisms/modals/keuangan/KasFormModal";
import { KasDeleteModal } from "@/components/organisms/modals/keuangan/KasDeleteModal";
import { KasApproveModal } from "@/components/organisms/modals/keuangan/KasApproveModal";

// ── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu_persetujuan", label: "Menunggu" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

const JENIS_OPTIONS = [
  { value: "all", label: "Semua Jenis" },
  { value: "masuk", label: "Kas Masuk" },
  { value: "keluar", label: "Kas Keluar" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Rp 0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    menunggu_persetujuan: {
      label: "Menunggu",
      icon: <Clock className="size-3 mr-1" />,
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    disetujui: {
      label: "Disetujui",
      icon: <CheckCircle2 className="size-3 mr-1" />,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    ditolak: {
      label: "Ditolak",
      icon: <XCircle className="size-3 mr-1" />,
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
  };
  const config = map[status] ?? { label: status, icon: null, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`text-[11px] font-semibold flex items-center w-fit ${config.className}`}>
      {config.icon}{config.label}
    </Badge>
  );
}

// ── Summary Card Component ────────────────────────────────────────────────────
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
export default function BukuKasPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jenisFilter, setJenisFilter] = useState("all");

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selectedKas, setSelectedKas] = useState<Kas | null>(null);

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetKasListQuery({
    page,
    limit: LIMIT,
    status: statusFilter !== "all" ? statusFilter : undefined,
    jenis_kas: jenisFilter !== "all" ? jenisFilter : undefined,
    search: search || undefined,
  });

  const records: Kas[] = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;

  // Computed summaries from current page
  const totalMasuk = records
    .filter((r) => r.jenis_kas === "masuk" && r.status === "disetujui")
    .reduce((acc, r) => acc + Number(r.jumlah), 0);
  const totalKeluar = records
    .filter((r) => r.jenis_kas === "keluar" && r.status === "disetujui")
    .reduce((acc, r) => acc + Number(r.jumlah), 0);
  const totalMenunggu = records.filter((r) => r.status === "menunggu_persetujuan").length;

  const hasFilter = search || statusFilter !== "all" || jenisFilter !== "all";

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => { setPage(1); setSearch(searchInput); }, [searchInput]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };
  const resetFilters = () => {
    setSearch(""); setSearchInput(""); setStatusFilter("all"); setJenisFilter("all"); setPage(1);
  };

  const openCreate = () => { setSelectedKas(null); setFormOpen(true); };
  const openEdit = (kas: Kas) => { setSelectedKas(kas); setFormOpen(true); };
  const openDelete = (kas: Kas) => { setSelectedKas(kas); setDeleteOpen(true); };
  const openApprove = (kas: Kas) => { setSelectedKas(kas); setApproveOpen(true); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Keuangan / Buku Kas" />

      <div className="flex flex-col gap-5 p-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Buku Kas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Kelola pencatatan kas masuk dan kas keluar organisasi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/anggaran" target="_blank" className="gap-1.5">
                <ExternalLink className="size-3.5" /> Lihat Publik
              </a>
            </Button>
            <Button onClick={openCreate} className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
              <Plus className="size-4" /> Catat Kas
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Transaksi"
            value={String(total)}
            sub="Semua data kas"
            icon={Wallet}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <SummaryCard
            label="Kas Masuk (Disetujui)"
            value={formatRupiah(totalMasuk)}
            sub={`${records.filter((r) => r.jenis_kas === "masuk").length} transaksi di halaman ini`}
            icon={TrendingUp}
            color="text-emerald-600"
            bgColor="bg-emerald-100 dark:bg-emerald-900/20"
          />
          <SummaryCard
            label="Kas Keluar (Disetujui)"
            value={formatRupiah(totalKeluar)}
            sub={`${records.filter((r) => r.jenis_kas === "keluar").length} transaksi di halaman ini`}
            icon={TrendingDown}
            color="text-red-600"
            bgColor="bg-red-100 dark:bg-red-900/20"
          />
          <SummaryCard
            label="Menunggu Persetujuan"
            value={String(totalMenunggu)}
            sub="Perlu ditinjau"
            icon={Clock}
            color="text-amber-600"
            bgColor="bg-amber-100 dark:bg-amber-900/20"
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
              placeholder="Cari nomor kas, deskripsi, sumber..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
            />
          </div>

          <Select value={jenisFilter} onValueChange={(v) => { setJenisFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-muted/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JENIS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            {isLoading ? "..." : total} transaksi
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
              <Wallet className="size-14 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Belum ada data kas</p>
              <p className="text-sm text-muted-foreground">
                {hasFilter ? "Coba ubah filter pencarian." : "Mulai catat transaksi kas organisasi."}
              </p>
              {!hasFilter && (
                <Button size="sm" onClick={openCreate} className="mt-2 gap-2">
                  <Plus className="size-4" /> Catat Kas Pertama
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-5 w-[160px]">No. Kas</TableHead>
                  <TableHead className="w-[90px]">Jenis</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Sumber / Tujuan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="w-[52px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((kas) => {
                  const canApprove = kas.status === "menunggu_persetujuan";
                  return (
                    <TableRow
                      key={kas.id}
                      className={`hover:bg-muted/30 transition-colors ${isFetching ? "opacity-60" : ""}`}
                    >
                      <TableCell className="pl-5">
                        <span className="text-xs font-mono text-muted-foreground">{kas.nomor_kas}</span>
                      </TableCell>
                      <TableCell>
                        {kas.jenis_kas === "masuk" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <TrendingUp className="size-3.5" /> Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
                            <TrendingDown className="size-3.5" /> Keluar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{kas.deskripsi}</p>
                        {kas.dicatat_oleh && (
                          <p className="text-xs text-muted-foreground">
                            oleh {kas.dicatat_oleh.nama_lengkap}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{kas.sumber_tujuan}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(kas.tanggal), "dd MMM yyyy", { locale: localeId })}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(kas.status)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`text-sm font-bold ${
                            kas.jenis_kas === "masuk"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {kas.jenis_kas === "masuk" ? "+" : "-"}{formatRupiah(kas.jumlah)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {canApprove && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => openApprove(kas)}
                                  className="text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                                >
                                  <CheckCircle2 className="mr-2 size-4" /> Tinjau & Setujui
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem onClick={() => openEdit(kas)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDelete(kas)}
                              className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                            >
                              <Trash2 className="mr-2 size-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* Modals */}
      <KasFormModal
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        initialData={selectedKas}
        onSuccess={() => { setFormOpen(false); setSelectedKas(null); refetch(); }}
      />

      <KasDeleteModal
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        dataId={selectedKas?.id ?? null}
        nomorKas={selectedKas?.nomor_kas}
        onSuccess={() => { setDeleteOpen(false); setSelectedKas(null); refetch(); }}
      />

      <KasApproveModal
        kas={selectedKas}
        isOpen={approveOpen}
        onOpenChange={setApproveOpen}
        onSuccess={() => { setApproveOpen(false); setSelectedKas(null); refetch(); }}
      />
    </div>
  );
}
