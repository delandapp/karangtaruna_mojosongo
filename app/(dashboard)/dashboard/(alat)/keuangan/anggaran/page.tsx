"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Layers,
  SlidersHorizontal,
  Pencil,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  ChevronRight as ChevronRightSm,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";

import {
  useGetAllAnggaranQuery,
  useApproveAnggaranMutation,
  useDeleteAnggaranMutation,
  type Anggaran,
} from "@/features/api/anggaranApi";
import {
  useGetItemAnggaranQuery,
  useDeleteItemAnggaranMutation,
  type ItemAnggaran,
} from "@/features/api/keuanganApi";
import { AnggaranFormModal } from "@/components/organisms/modals/event/AnggaranFormModal";
import { AnggaranDeleteModal } from "@/components/organisms/modals/event/AnggaranDeleteModal";
import { ItemAnggaranFormModal } from "@/components/organisms/modals/keuangan/ItemAnggaranFormModal";
import { ItemAnggaranDeleteModal } from "@/components/organisms/modals/keuangan/ItemAnggaranDeleteModal";
import { ItemAnggaranRealisasiModal } from "@/components/organisms/modals/keuangan/ItemAnggaranRealisasiModal";

// ── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "all",      label: "Semua Status"  },
  { value: "draft",    label: "Draft"         },
  { value: "diajukan", label: "Diajukan"      },
  { value: "disetujui",label: "Disetujui"     },
  { value: "ditolak",  label: "Ditolak"       },
  { value: "revisi",   label: "Revisi"        },
  { value: "final",    label: "Final"         },
];

const SKENARIO_OPTIONS = [
  { value: "all",     label: "Semua Skenario" },
  { value: "optimis", label: "Optimis"        },
  { value: "moderat", label: "Moderat"        },
  { value: "pesimis", label: "Pesimis"        },
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
  const map: Record<string, { label: string; className: string }> = {
    draft:     { label: "Draft",     className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
    diajukan:  { label: "Diajukan",  className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    disetujui: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    ditolak:   { label: "Ditolak",   className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    revisi:    { label: "Revisi",    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    final:     { label: "Final",     className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({
  anggaran, isOpen, onOpenChange, onSuccess,
}: {
  anggaran: Anggaran | null;
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  onSuccess: () => void;
}) {
  const [approve, { isLoading }] = useApproveAnggaranMutation();

  const handleApprove = async () => {
    if (!anggaran) return;
    try {
      await approve({ eventId: anggaran.event_id, id: anggaran.id, body: { status: "disetujui" } }).unwrap();
      toast.success("Anggaran berhasil disetujui");
      onSuccess();
    } catch (err: any) {
      toast.error("Gagal menyetujui", { description: err?.data?.error?.message || "Terjadi kesalahan" });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <AlertDialogTitle>Setujui Anggaran</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1">
            Setujui anggaran skenario{" "}
            <span className="font-semibold text-foreground capitalize">{anggaran?.skenario}</span>{" "}
            v{anggaran?.versi} dari{" "}
            <span className="font-semibold text-foreground">{anggaran?.event?.nama_event}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={isLoading} className="bg-transparent border-border/50">Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleApprove(); }}
            disabled={isLoading}
            className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
          >
            {isLoading ? "Menyetujui..." : "Ya, Setujui"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Item Anggaran Sub-Panel ───────────────────────────────────────────────────
function ItemPanel({ anggaran, onAdd, onEdit, onDelete, onRealisasi }: {
  anggaran: Anggaran;
  onAdd: () => void;
  onEdit: (item: ItemAnggaran) => void;
  onDelete: (item: ItemAnggaran) => void;
  onRealisasi: (item: ItemAnggaran) => void;
}) {
  const { data, isLoading } = useGetItemAnggaranQuery({
    eventId: anggaran.event_id,
    anggaranId: anggaran.id,
    limit: 100,
  });

  const items: ItemAnggaran[] = data?.data ?? [];

  const pemasukan  = items.filter((i) => i.jenis_item === "pemasukan");
  const pengeluaran = items.filter((i) => i.jenis_item === "pengeluaran");

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Package className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Rincian Item Anggaran
            </p>
            <p className="text-xs text-muted-foreground">
              {anggaran.event?.nama_event} — Skenario{" "}
              <span className="capitalize font-medium">{anggaran.skenario}</span> v{anggaran.versi}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{items.length} item</Badge>
          <Button size="sm" onClick={onAdd} className="h-8 gap-1.5 shadow-sm shadow-primary/20">
            <Plus className="size-3.5" /> Tambah Item
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <Package className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Belum ada rincian item pada anggaran ini.</p>
          <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5">
            <Plus className="size-3.5" /> Tambah Item Pertama
          </Button>
        </div>
      ) : (
        <div>
          {/* Pemasukan */}
          {pemasukan.length > 0 && (
            <div>
              <div className="px-5 py-2 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  💰 Pemasukan ({pemasukan.length} item)
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="pl-5">Kategori / Deskripsi</TableHead>
                    <TableHead className="text-right">Vol</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total Rencana</TableHead>
                    <TableHead className="text-right">Realisasi</TableHead>
                    <TableHead className="w-[52px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pemasukan.map((item) => (
                    <ItemRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onRealisasi={onRealisasi} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pengeluaran */}
          {pengeluaran.length > 0 && (
            <div className={pemasukan.length > 0 ? "border-t border-border/40" : ""}>
              <div className="px-5 py-2 bg-red-50/50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30">
                <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
                  💸 Pengeluaran ({pengeluaran.length} item)
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="pl-5">Kategori / Deskripsi</TableHead>
                    <TableHead className="text-right">Vol</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total Rencana</TableHead>
                    <TableHead className="text-right">Realisasi</TableHead>
                    <TableHead className="w-[52px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengeluaran.map((item) => (
                    <ItemRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} onRealisasi={onRealisasi} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete, onRealisasi }: {
  item: ItemAnggaran;
  onEdit: (i: ItemAnggaran) => void;
  onDelete: (i: ItemAnggaran) => void;
  onRealisasi: (i: ItemAnggaran) => void;
}) {
  const realisasi = item.total_realisasi != null ? Number(item.total_realisasi) : null;
  const rencana   = Number(item.total_rencana);
  const overBudget = realisasi !== null && realisasi > rencana;

  return (
    <TableRow className="group hover:bg-muted/30">
      <TableCell className="pl-5">
        <div>
          <p className="text-sm font-medium text-foreground">{item.deskripsi}</p>
          <p className="text-xs text-muted-foreground">{item.kategori}{item.kode_item ? ` · ${item.kode_item}` : ""}</p>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm">{item.jumlah_satuan}</TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">{formatRupiah(item.harga_satuan_rencana)}</TableCell>
      <TableCell className="text-right text-sm font-medium">{formatRupiah(item.total_rencana)}</TableCell>
      <TableCell className="text-right">
        {realisasi !== null ? (
          <span className={`text-sm font-semibold ${overBudget ? "text-red-600" : "text-emerald-600"}`}>
            {formatRupiah(realisasi)}
          </span>
        ) : (
          <button
            onClick={() => onRealisasi(item)}
            className="text-[11px] text-muted-foreground/60 hover:text-primary hover:underline transition-colors"
          >
            + Input
          </button>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onRealisasi(item)} className="text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20">
              <TrendingUp className="mr-2 size-3.5" /> Input Realisasi
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="mr-2 size-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
              <Trash2 className="mr-2 size-3.5" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function KeuanganAnggaranPage() {
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState("");
  const [searchInput, setSearchInput]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skenarioFilter, setSkenarioFilter] = useState("all");

  // Selected row
  const [selectedAnggaran, setSelectedAnggaran] = useState<Anggaran | null>(null);

  // Anggaran modals
  const [formOpen, setFormOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [modalAnggaran, setModalAnggaran] = useState<Anggaran | null>(null);

  // Item Anggaran modals
  const [itemFormOpen, setItemFormOpen]         = useState(false);
  const [itemDeleteOpen, setItemDeleteOpen]     = useState(false);
  const [itemRealisasiOpen, setItemRealisasiOpen] = useState(false);
  const [selectedItem, setSelectedItem]         = useState<ItemAnggaran | null>(null);

  // ── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetAllAnggaranQuery({
    page,
    limit: LIMIT,
    status:   statusFilter   !== "all" ? statusFilter   : undefined,
    skenario: skenarioFilter !== "all" ? skenarioFilter : undefined,
    search:   search || undefined,
  });

  const records: Anggaran[] = (data?.data as Anggaran[]) ?? [];
  const meta   = data?.meta;
  const total  = meta?.total    ?? 0;
  const pages  = meta?.totalPages ?? 1;
  const hasFilter = search || statusFilter !== "all" || skenarioFilter !== "all";

  // Auto-select first row on load
  useEffect(() => {
    if (!selectedAnggaran && records.length > 0) {
      setSelectedAnggaran(records[0]);
    }
  }, [records, selectedAnggaran]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(() => { setPage(1); setSearch(searchInput); }, [searchInput]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") handleSearch(); };
  const resetFilters = () => { setSearch(""); setSearchInput(""); setStatusFilter("all"); setSkenarioFilter("all"); setPage(1); };

  // Anggaran actions
  const openCreate  = () => { setModalAnggaran(null); setFormOpen(true); };
  const openEdit    = (a: Anggaran) => { setModalAnggaran(a); setFormOpen(true); };
  const openDelete  = (a: Anggaran) => { setModalAnggaran(a); setDeleteOpen(true); };
  const openApprove = (a: Anggaran) => { setModalAnggaran(a); setApproveOpen(true); };

  // Item Anggaran actions (operate on selectedAnggaran)
  const openItemAdd      = () => { setSelectedItem(null); setItemFormOpen(true); };
  const openItemEdit     = (i: ItemAnggaran) => { setSelectedItem(i); setItemFormOpen(true); };
  const openItemDelete   = (i: ItemAnggaran) => { setSelectedItem(i); setItemDeleteOpen(true); };
  const openItemRealisasi= (i: ItemAnggaran) => { setSelectedItem(i); setItemRealisasiOpen(true); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Keuangan / Anggaran" />

      <div className="flex flex-col gap-5 p-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Anggaran</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola dan pantau seluruh rancangan anggaran event</p>
          </div>
          <Button onClick={openCreate} className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all">
            <Plus className="size-4" /> Buat Anggaran
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Anggaran", value: total,                                                           icon: FileText,        color: "text-primary"    },
            { label: "Disetujui",      value: records.filter((r) => r.status === "disetujui").length,          icon: CheckCircle2,    color: "text-emerald-600"},
            { label: "Draft",          value: records.filter((r) => r.status === "draft").length,              icon: Layers,          color: "text-slate-500"  },
            { label: "Menunggu",       value: records.filter((r) => r.status === "diajukan").length,           icon: SlidersHorizontal, color: "text-blue-500" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl border border-border/50 bg-card/60 backdrop-blur px-4 py-3 flex items-center gap-3">
              <c.icon className={`size-5 shrink-0 ${c.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold text-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Cari nama event..." className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40" />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={skenarioFilter} onValueChange={(v) => { setSkenarioFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-muted/40 border-border/60"><SelectValue /></SelectTrigger>
            <SelectContent>{SKENARIO_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="bg-muted/40 border-border/60 shrink-0">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin text-muted-foreground" : ""}`} />
          </Button>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground">Reset filter</Button>
          )}

          <Badge variant="secondary" className="ml-auto text-xs px-3 py-1">{isLoading ? "..." : total} anggaran</Badge>
        </div>

        {/* Anggaran Table with clickable rows */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <FileText className="size-14 text-muted-foreground/30" />
              <p className="font-medium text-foreground">Belum ada data anggaran</p>
              <p className="text-sm text-muted-foreground">{hasFilter ? "Coba ubah filter pencarian." : "Mulai buat anggaran untuk suatu event."}</p>
              {!hasFilter && <Button size="sm" onClick={openCreate} className="mt-2 gap-2"><Plus className="size-4" /> Buat Anggaran</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-5 pl-4"></TableHead>
                  <TableHead className="w-[200px]">Event</TableHead>
                  <TableHead>Skenario</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rencana Masuk</TableHead>
                  <TableHead className="text-right">Rencana Keluar</TableHead>
                  <TableHead className="text-right">Realisasi Masuk</TableHead>
                  <TableHead className="text-right">Realisasi Keluar</TableHead>
                  <TableHead className="text-center">Item</TableHead>
                  <TableHead className="w-[52px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((anggaran) => {
                  const isActive   = selectedAnggaran?.id === anggaran.id;
                  const canApprove = anggaran.status === "diajukan" || anggaran.status === "revisi";
                  return (
                    <TableRow
                      key={anggaran.id}
                      onClick={() => setSelectedAnggaran(anggaran)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? "bg-primary/8 dark:bg-primary/10 border-l-2 border-l-primary hover:bg-primary/10 dark:hover:bg-primary/15"
                          : "hover:bg-muted/40 border-l-2 border-l-transparent"
                      } ${isFetching ? "opacity-60" : ""}`}
                    >
                      <TableCell className="pl-4 pr-0">
                        {isActive && <ChevronRightSm className="size-3.5 text-primary" />}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-semibold text-sm line-clamp-1 ${isActive ? "text-primary" : "text-foreground"}`}>
                            {anggaran.event?.nama_event ?? `Event #${anggaran.event_id}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize text-sm font-medium">{anggaran.skenario}</span>
                          <span className="text-[11px] text-muted-foreground">v{anggaran.versi}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(anggaran.status)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatRupiah(anggaran.total_pemasukan_rencana)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">{formatRupiah(anggaran.total_pengeluaran_rencana)}</TableCell>
                      <TableCell className="text-right text-sm">
                        {anggaran.total_pemasukan_realisasi
                          ? <span className="text-emerald-600 font-medium">{formatRupiah(anggaran.total_pemasukan_realisasi)}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {anggaran.total_pengeluaran_realisasi
                          ? <span className="text-red-600 font-medium">{formatRupiah(anggaran.total_pengeluaran_realisasi)}</span>
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                          {anggaran._count?.item_anggaran ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/event/${anggaran.event_id}?tab=anggaran`}>
                                <ArrowUpRight className="mr-2 size-4" /> Lihat di Event
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canApprove && (
                              <DropdownMenuItem onClick={() => openApprove(anggaran)} className="text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                                <CheckCircle2 className="mr-2 size-4" /> Setujui
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openEdit(anggaran)}>
                              <Pencil className="mr-2 size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDelete(anggaran)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
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
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isFetching} className="gap-1.5">
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages || isFetching} className="gap-1.5">
                Berikutnya <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Item Anggaran Panel */}
        {selectedAnggaran && (
          <div className="mt-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
              <Separator className="flex-1 opacity-50" />
              <span>Item Anggaran untuk baris dipilih</span>
              <Separator className="flex-1 opacity-50" />
            </div>
            <ItemPanel
              anggaran={selectedAnggaran}
              onAdd={openItemAdd}
              onEdit={openItemEdit}
              onDelete={openItemDelete}
              onRealisasi={openItemRealisasi}
            />
          </div>
        )}
      </div>

      {/* Anggaran Modals */}
      <AnggaranFormModal
        eventId={modalAnggaran?.event_id ?? 0}
        isOpen={formOpen && !!(modalAnggaran?.event_id)}
        onOpenChange={setFormOpen}
        initialData={modalAnggaran}
        onSuccess={() => { setFormOpen(false); refetch(); }}
      />

      <AnggaranDeleteModal
        eventId={modalAnggaran?.event_id ?? 0}
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        dataId={modalAnggaran?.id ?? null}
        skenarioName={modalAnggaran?.skenario ?? ""}
        onSuccess={() => { setDeleteOpen(false); if (modalAnggaran?.id === selectedAnggaran?.id) setSelectedAnggaran(null); refetch(); }}
      />

      <ApproveModal
        anggaran={modalAnggaran}
        isOpen={approveOpen}
        onOpenChange={setApproveOpen}
        onSuccess={() => { setApproveOpen(false); refetch(); }}
      />

      {/* Item Anggaran Modals */}
      {selectedAnggaran && (
        <>
          <ItemAnggaranFormModal
            eventId={selectedAnggaran.event_id}
            anggaranId={selectedAnggaran.id}
            isOpen={itemFormOpen}
            onOpenChange={setItemFormOpen}
            initialData={selectedItem}
            onSuccess={() => { setItemFormOpen(false); setSelectedItem(null); }}
          />

          <ItemAnggaranDeleteModal
            eventId={selectedAnggaran.event_id}
            anggaranId={selectedAnggaran.id}
            isOpen={itemDeleteOpen}
            onOpenChange={setItemDeleteOpen}
            dataId={selectedItem?.id ?? null}
            itemName={selectedItem?.deskripsi}
            onSuccess={() => { setItemDeleteOpen(false); setSelectedItem(null); }}
          />

          <ItemAnggaranRealisasiModal
            eventId={selectedAnggaran.event_id}
            anggaranId={selectedAnggaran.id}
            item={selectedItem}
            isOpen={itemRealisasiOpen}
            onOpenChange={setItemRealisasiOpen}
            onSuccess={() => { setItemRealisasiOpen(false); setSelectedItem(null); }}
          />
        </>
      )}
    </div>
  );
}
