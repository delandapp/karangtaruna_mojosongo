"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Trash2,
  Pencil,
  MoreHorizontal,
  Eye,
  PlusCircle,
  X,
  Users,
  AlertCircle,
  TrendingUp,
  Award,
  FileSignature,
  Printer,
  ChevronRight as ChevronRightSm,
} from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";

import {
  useGetNotulenQuery,
  useCreateNotulenMutation,
  useUpdateNotulenMutation,
  useDeleteNotulenMutation,
  useGetNotulenByIdQuery,
  type Notulen,
  type PoinBahasan,
  type KeputusanRapat,
  type TindakLanjut,
  type StatusNotulen,
  type PrioritasTindakLanjut,
  type StatusTindakLanjut,
} from "@/features/api/notulenApi";
import { useGetRapatQuery, type Rapat } from "@/features/api/rapatApi";
import { useGetUsersQuery } from "@/features/api/userApi";

const LIMIT = 10;

const STATUS_NOTULEN_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "REVIEW", label: "Review" },
  { value: "FINAL", label: "Final" },
];

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
    REVIEW: { label: "Review", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    FINAL: { label: "Final (Disetujui)", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function getPriorityBadge(prio: string) {
  const map: Record<string, string> = {
    TINGGI: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    SEDANG: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    RENDAH: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800",
  };
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 px-2 rounded-full border ${map[prio] ?? ""}`}>
      {prio}
    </Badge>
  );
}

// Sub-component wrapper for loading search params safely in Next.js Suspense
function NotulenDashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paramNotulenId = searchParams?.get("id");
  const paramAction = searchParams?.get("action");
  const paramRapatId = searchParams?.get("rapat_id");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedNotulen, setSelectedNotulen] = useState<Notulen | null>(null);

  // Modals state
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notulenToDelete, setNotulenToDelete] = useState<Notulen | null>(null);

  // Form input state
  const [isEditMode, setIsEditMode] = useState(false);
  const [formNotulenId, setFormNotulenId] = useState<number | null>(null);
  
  const [rapatId, setRapatId] = useState("");
  const [nomorNotulen, setNomorNotulen] = useState("");
  const [statusNotulen, setStatusNotulen] = useState<StatusNotulen>("DRAFT");
  const [pembukaan, setPembukaan] = useState("");
  const [penutupan, setPenutupan] = useState("");
  const [kesimpulanUmum, setKesimpulanUmum] = useState("");

  // Poin Bahasan, Keputusan, Tindak Lanjut inside form
  const [poinBahasan, setPoinBahasan] = useState<PoinBahasan[]>([]);
  const [keputusan, setKeputusan] = useState<KeputusanRapat[]>([]);
  const [tindakLanjut, setTindakLanjut] = useState<TindakLanjut[]>([]);

  // ── Queries and Mutations ──────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetNotulenQuery({
    page,
    limit: LIMIT,
    status: statusFilter !== "all" ? (statusFilter as StatusNotulen) : undefined,
    search: search || undefined,
  });

  const { data: rapatData } = useGetRapatQuery({ limit: 100 });
  const { data: usersData } = useGetUsersQuery({ limit: 100 });

  const [createNotulen, { isLoading: isCreating }] = useCreateNotulenMutation();
  const [updateNotulen, { isLoading: isUpdating }] = useUpdateNotulenMutation();
  const [deleteNotulen, { isLoading: isDeleting }] = useDeleteNotulenMutation();

  // Detail query for query params loading
  const { data: queryDetailData } = useGetNotulenByIdQuery(
    paramNotulenId ? parseInt(paramNotulenId, 10) : -1,
    { skip: !paramNotulenId }
  );

  const records = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;
  const hasFilter = search || statusFilter !== "all";

  // Watch URL params for detail load
  useEffect(() => {
    if (queryDetailData?.data) {
      setSelectedNotulen(queryDetailData.data);
      setDetailOpen(true);
      // Clear URL params to avoid modal popping again on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [queryDetailData]);

  // Watch URL params for create load
  useEffect(() => {
    if (paramAction === "create" && paramRapatId) {
      openCreateModal(parseInt(paramRapatId, 10));
      // Clear URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [paramAction, paramRapatId]);

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("all");
    setPage(1);
  };

  // Add/remove / update helper functions for form dynamic items
  const addPoinBahasanRow = () => {
    setPoinBahasan([
      ...poinBahasan,
      { urutan: poinBahasan.length + 1, isi_bahasan: "", pembicara: "", c_agenda_rapat_id: null },
    ]);
  };

  const removePoinBahasanRow = (index: number) => {
    const updated = poinBahasan.filter((_, i) => i !== index);
    setPoinBahasan(updated.map((item, idx) => ({ ...item, urutan: idx + 1 })));
  };

  const updatePoinBahasanValue = (index: number, key: keyof PoinBahasan, value: any) => {
    const updated = [...poinBahasan];
    updated[index] = { ...updated[index], [key]: value };
    setPoinBahasan(updated);
  };

  const addKeputusanRow = () => {
    setKeputusan([
      ...keputusan,
      { urutan: keputusan.length + 1, isi_keputusan: "", dasar_keputusan: "", is_konsensus: true },
    ]);
  };

  const removeKeputusanRow = (index: number) => {
    const updated = keputusan.filter((_, i) => i !== index);
    setKeputusan(updated.map((item, idx) => ({ ...item, urutan: idx + 1 })));
  };

  const updateKeputusanValue = (index: number, key: keyof KeputusanRapat, value: any) => {
    const updated = [...keputusan];
    updated[index] = { ...updated[index], [key]: value };
    setKeputusan(updated);
  };

  const addTindakLanjutRow = () => {
    setTindakLanjut([
      ...tindakLanjut,
      { m_user_id_pic: 1, judul: "", deskripsi: "", deadline: "", prioritas: "SEDANG", status: "BELUM_MULAI" },
    ]);
  };

  const removeTindakLanjutRow = (index: number) => {
    setTindakLanjut(tindakLanjut.filter((_, i) => i !== index));
  };

  const updateTindakLanjutValue = (index: number, key: keyof TindakLanjut, value: any) => {
    const updated = [...tindakLanjut];
    updated[index] = { ...updated[index], [key]: value };
    setTindakLanjut(updated);
  };

  // Open Create Modal
  const openCreateModal = (prefilledRapatId?: number) => {
    setIsEditMode(false);
    setFormNotulenId(null);
    setRapatId(prefilledRapatId ? String(prefilledRapatId) : "");
    setNomorNotulen(`NOT-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`);
    setStatusNotulen("DRAFT");
    setPembukaan("Rapat dibuka oleh Moderator pada waktu yang dijadwalkan.");
    setPenutupan("Rapat ditutup dengan doa bersama dan kesepakatan tindak lanjut.");
    setKesimpulanUmum("");
    setPoinBahasan([
      { urutan: 1, isi_bahasan: "Pembahasan rancangan program kerja masing-masing divisi.", pembicara: "Deland", c_agenda_rapat_id: null },
    ]);
    setKeputusan([
      { urutan: 1, isi_keputusan: "Menyetujui agenda pelaksanaan Pesta Rakyat.", dasar_keputusan: "Musyawarah mufakat", is_konsensus: true },
    ]);
    setTindakLanjut([]);
    setFormOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (notulen: Notulen) => {
    setIsEditMode(true);
    setFormNotulenId(notulen.id);
    setRapatId(String(notulen.m_rapat_id));
    setNomorNotulen(notulen.nomor_notulen);
    setStatusNotulen(notulen.status);
    setPembukaan(notulen.pembukaan ?? "");
    setPenutupan(notulen.penutupan ?? "");
    setKesimpulanUmum(notulen.kesimpulan_umum ?? "");

    // Arrays
    if (notulen.poin_bahasan) {
      setPoinBahasan(notulen.poin_bahasan.map(pb => ({ ...pb })));
    } else {
      setPoinBahasan([]);
    }

    if (notulen.keputusan) {
      setKeputusan(notulen.keputusan.map(k => ({ ...k })));
    } else {
      setKeputusan([]);
    }

    if (notulen.tindak_lanjut) {
      setTindakLanjut(notulen.tindak_lanjut.map(tl => ({ ...tl })));
    } else {
      setTindakLanjut([]);
    }

    setFormOpen(true);
  };

  // Submit Notulen
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rapatId || !nomorNotulen) {
      toast.error("Rapat dan nomor notulen wajib diisi!");
      return;
    }

    const payload = {
      m_rapat_id: parseInt(rapatId, 10),
      nomor_notulen: nomorNotulen,
      status: statusNotulen,
      pembukaan: pembukaan || null,
      penutupan: penutupan || null,
      kesimpulan_umum: kesimpulanUmum || null,
      poin_bahasan: poinBahasan.map(pb => ({
        urutan: pb.urutan,
        isi_bahasan: pb.isi_bahasan,
        pembicara: pb.pembicara || null,
        c_agenda_rapat_id: pb.c_agenda_rapat_id || null,
      })),
      keputusan: keputusan.map(k => ({
        urutan: k.urutan,
        isi_keputusan: k.isi_keputusan,
        dasar_keputusan: k.dasar_keputusan || null,
        is_konsensus: k.is_konsensus,
      })),
      tindak_lanjut: tindakLanjut.map(tl => ({
        m_user_id_pic: tl.m_user_id_pic ? Number(tl.m_user_id_pic) : null,
        judul: tl.judul,
        deskripsi: tl.deskripsi || null,
        deadline: tl.deadline ? new Date(tl.deadline).toISOString() : null,
        prioritas: tl.prioritas,
        status: tl.status,
      })),
    };

    try {
      if (isEditMode && formNotulenId) {
        await updateNotulen({ id: formNotulenId, body: payload }).unwrap();
        toast.success("Notulen berhasil diperbarui!");
      } else {
        await createNotulen(payload).unwrap();
        toast.success("Notulen baru berhasil disusun!");
      }
      setFormOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(isEditMode ? "Gagal memperbarui notulen" : "Gagal menyusun notulen", {
        description: err?.data?.error?.message || "Terjadi kesalahan format data atau sistem.",
      });
    }
  };

  // Open Delete Dialog
  const openDeleteDialog = (notulen: Notulen) => {
    setNotulenToDelete(notulen);
    setDeleteOpen(true);
  };

  // Delete execution
  const handleDelete = async () => {
    if (!notulenToDelete) return;
    try {
      await deleteNotulen(notulenToDelete.id).unwrap();
      toast.success("Notulen berhasil dihapus");
      setDeleteOpen(false);
      setNotulenToDelete(null);
      refetch();
    } catch (err: any) {
      toast.error("Gagal menghapus notulen", {
        description: err?.data?.error?.message || "Tindakan ditolak (hanya status DRAFT yang bisa dihapus)",
      });
    }
  };

  const openDetail = (notulen: Notulen) => {
    setSelectedNotulen(notulen);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Notulen" />

      <div className="flex flex-col gap-6 p-6">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileSignature className="size-6 text-primary" /> Notulen Hasil Rapat
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Dokumentasikan poin bahasan rapat, dasar keputusan, serta pantau tindak lanjut program kerja
            </p>
          </div>
          <Button
            onClick={() => openCreateModal()}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
          >
            <Plus className="size-4" /> Susun Notulen Baru
          </Button>
        </div>

        {/* Stat cards summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Notulen", value: total, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
            { label: "Draft", value: records.filter((r) => r.status === "DRAFT").length, icon: Pencil, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/50" },
            { label: "Review", value: records.filter((r) => r.status === "REVIEW").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100/50 dark:bg-amber-950/20" },
            { label: "Final (Disetujui)", value: records.filter((r) => r.status === "FINAL").length, icon: Award, color: "text-emerald-600", bg: "bg-emerald-100/50 dark:bg-emerald-950/20" },
          ].map((c, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur px-5 py-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{isLoading ? "..." : c.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}>
                <c.icon className="size-5 shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari kesimpulan, nomor, pembukaan, penutupan..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-muted/40 border-border/60 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_NOTULEN_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-muted/40 border-border/60 shrink-0 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin text-muted-foreground" : ""}`} />
          </Button>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground cursor-pointer">
              Reset filter
            </Button>
          )}

          <Badge variant="secondary" className="ml-auto text-xs px-3 py-1 font-medium bg-muted/50 text-muted-foreground">
            {isLoading ? "..." : total} notulen
          </Badge>
        </div>

        {/* Table list */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="p-4 bg-muted rounded-full text-muted-foreground/45">
                <FileText className="size-12" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">Belum ada notulen rapat</p>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {hasFilter ? "Coba sesuaikan kata kunci pencarian atau status filter Anda." : "Notulen hasil rapat belum diarsipkan."}
                </p>
              </div>
              {!hasFilter && (
                <Button size="sm" onClick={() => openCreateModal()} className="mt-2 gap-2 rounded-xl cursor-pointer">
                  <Plus className="size-4" /> Susun Notulen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6 w-[250px]">Nomor & Rapat</TableHead>
                  <TableHead>Notulis (Penyusun)</TableHead>
                  <TableHead>Kesimpulan Umum</TableHead>
                  <TableHead>Tanggal Penyusunan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[52px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((notulen: Notulen) => (
                  <TableRow
                    key={notulen.id}
                    className="hover:bg-muted/30 cursor-pointer group transition-colors"
                    onClick={() => openDetail(notulen)}
                  >
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {notulen.rapat?.judul_rapat ?? "Judul Rapat Terkait"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          Nomor: {notulen.nomor_notulen}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground font-medium">
                          {notulen.notulis?.nama_lengkap ?? "Notulis Utama"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[280px]">
                        {notulen.kesimpulan_umum ?? "Belum diisi kesimpulan akhir."}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(notulen.dibuat_pada), "d MMMM yyyy", { locale: localeId })}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(notulen.status)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem onClick={() => openDetail(notulen)}>
                            <Eye className="mr-2 size-4" /> Detail Notulen
                          </DropdownMenuItem>
                          {notulen.status !== "FINAL" && (
                            <DropdownMenuItem onClick={() => openEditModal(notulen)}>
                              <Pencil className="mr-2 size-4" /> Edit Draf
                            </DropdownMenuItem>
                          )}
                          {notulen.status !== "FINAL" && (
                            <DropdownMenuItem
                              onClick={() => {
                                updateNotulen({ id: notulen.id, body: { status: "FINAL" } });
                                toast.success("Notulen resmi disahkan (FINAL)");
                                refetch();
                              }}
                              className="text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                            >
                              <CheckCircle2 className="mr-2 size-4" /> Sahkan (FINAL)
                            </DropdownMenuItem>
                          )}
                          {notulen.status === "DRAFT" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(notulen)}
                                className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                              >
                                <Trash2 className="mr-2 size-4" /> Hapus Draf
                              </DropdownMenuItem>
                            </>
                          )}
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
            <p className="text-sm text-muted-foreground font-medium">
              Halaman <span className="font-semibold text-foreground">{page}</span> dari{" "}
              <span className="font-semibold text-foreground">{pages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="gap-1.5 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="size-4" /> Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || isFetching}
                className="gap-1.5 rounded-xl cursor-pointer"
              >
                Berikutnya <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Notulen Detail View Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
          {selectedNotulen && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedNotulen.status)}
                    <span className="text-xs text-muted-foreground">Nomor: {selectedNotulen.nomor_notulen}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs rounded-xl cursor-pointer"
                    onClick={() => {
                      window.print();
                    }}
                  >
                    <Printer className="size-3.5" /> Cetak Notulen
                  </Button>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground pt-2">
                  Notulen: {selectedNotulen.rapat?.judul_rapat ?? "Rapat Pleno"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Disusun oleh Notulis: <span className="font-semibold text-foreground">{selectedNotulen.notulis?.nama_lengkap ?? "Notulis"}</span>
                </DialogDescription>
              </DialogHeader>

              <Separator className="opacity-50" />

              {/* Rapat Info */}
              <div className="bg-muted/20 border border-border/40 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-4 text-primary shrink-0" />
                  <span>Tanggal Terbit: <strong className="text-foreground">{format(new Date(selectedNotulen.dibuat_pada), "d MMMM yyyy", { locale: localeId })}</strong></span>
                </div>
                {selectedNotulen.disetujui_pada && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>Disahkan Pada: <strong className="text-foreground">{format(new Date(selectedNotulen.disetujui_pada), "d MMMM yyyy", { locale: localeId })}</strong></span>
                  </div>
                )}
              </div>

              {/* Pembukaan & Penutupan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedNotulen.pembukaan && (
                  <div className="p-4 border border-border/40 bg-muted/5 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      🎙️ Pembukaan Rapat
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedNotulen.pembukaan}</p>
                  </div>
                )}
                {selectedNotulen.penutupan && (
                  <div className="p-4 border border-border/40 bg-muted/5 rounded-2xl">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      🚪 Penutupan Rapat
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{selectedNotulen.penutupan}</p>
                  </div>
                )}
              </div>

              {/* Kesimpulan Umum */}
              {selectedNotulen.kesimpulan_umum && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                    💡 Ringkasan & Kesimpulan Umum
                  </p>
                  <p className="text-sm text-foreground leading-relaxed font-medium">{selectedNotulen.kesimpulan_umum}</p>
                </div>
              )}

              {/* Poin Bahasan */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  📝 Poin Pembahasan Rapat
                </p>
                {selectedNotulen.poin_bahasan && selectedNotulen.poin_bahasan.length > 0 ? (
                  <div className="border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/30 bg-muted/5">
                    {selectedNotulen.poin_bahasan.map((pb: PoinBahasan) => (
                      <div key={pb.id} className="p-3.5 flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {pb.urutan}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-relaxed">{pb.isi_bahasan}</p>
                          {pb.pembicara && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              💬 Pembicara: <span className="font-semibold text-foreground">{pb.pembicara}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Tidak ada poin pembahasan khusus.</p>
                )}
              </div>

              {/* Keputusan Rapat */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  ⚖️ Keputusan Hasil Rapat
                </p>
                {selectedNotulen.keputusan && selectedNotulen.keputusan.length > 0 ? (
                  <div className="border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/30 bg-muted/5">
                    {selectedNotulen.keputusan.map((k: KeputusanRapat) => (
                      <div key={k.id} className="p-3.5 flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          {k.urutan}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{k.isi_keputusan}</p>
                          {k.dasar_keputusan && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">Dasar keputusan: {k.dasar_keputusan}</p>
                          )}
                        </div>
                        {k.is_konsensus && (
                          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 shrink-0 rounded">
                            MUFAKAT
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Belum ada keputusan resmi yang diputuskan.</p>
                )}
              </div>

              {/* Action Items / Tindak Lanjut */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  🏃‍♂️ Tindak Lanjut & PIC
                </p>
                {selectedNotulen.tindak_lanjut && selectedNotulen.tindak_lanjut.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedNotulen.tindak_lanjut.map((tl: TindakLanjut) => (
                      <div
                        key={tl.id}
                        className="p-3.5 border border-border/40 bg-muted/5 rounded-2xl flex flex-col gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{tl.judul}</p>
                          {getPriorityBadge(tl.prioritas)}
                        </div>
                        {tl.deskripsi && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tl.deskripsi}</p>}
                        <Separator className="opacity-40" />
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-medium">PENANGGUNG JAWAB (PIC)</span>
                            <span className="font-semibold text-foreground mt-0.5">
                              {tl.pic?.nama_lengkap ?? "Pengurus"}
                            </span>
                          </div>
                          {tl.deadline && (
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block">TENGGAT WAKTU</span>
                              <span className="font-semibold text-red-600 block mt-0.5">
                                {format(new Date(tl.deadline), "d MMM yyyy", { locale: localeId })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Tidak ada rencana tindak lanjut khusus.</p>
                )}
              </div>

              <Separator className="opacity-50" />

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl cursor-pointer">
                  Tutup Notulen
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isEditMode ? "✍️ Edit Notulen Hasil Rapat" : "📝 Susun Notulen Rapat Baru"}
              </DialogTitle>
              <DialogDescription>
                Catat poin pembahasan, keputusan, dan penanggung jawab untuk memastikan tindak lanjut berjalan efektif
              </DialogDescription>
            </DialogHeader>

            <Separator className="opacity-50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column Fields */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Pilih Jadwal Rapat <span className="text-red-500">*</span>
                    </label>
                    <Select value={rapatId} onValueChange={setRapatId} disabled={isEditMode}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Pilih rapat..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rapatData?.data?.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>{r.judul_rapat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Nomor Notulen <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      value={nomorNotulen}
                      onChange={(e) => setNomorNotulen(e.target.value)}
                      placeholder="Contoh: NOT-2026-001"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    Status Notulen
                  </label>
                  <Select value={statusNotulen} onValueChange={(v) => setStatusNotulen(v as StatusNotulen)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="FINAL">Final (Sah)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    🎙️ Narasi Pembukaan Rapat
                  </label>
                  <textarea
                    value={pembukaan}
                    onChange={(e) => setPembukaan(e.target.value)}
                    placeholder="Contoh: Rapat dibuka pukul 09.00 WIB oleh Ketua Karang Taruna..."
                    rows={2.5}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    🚪 Narasi Penutupan Rapat
                  </label>
                  <textarea
                    value={penutupan}
                    onChange={(e) => setPenutupan(e.target.value)}
                    placeholder="Contoh: Rapat ditutup pukul 11.00 WIB dengan kesepakatan SK Kepanitiaan..."
                    rows={2.5}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/60"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    💡 Kesimpulan Akhir / Ringkasan Umum
                  </label>
                  <textarea
                    value={kesimpulanUmum}
                    onChange={(e) => setKesimpulanUmum(e.target.value)}
                    placeholder="Contoh: Panitia pelaksana pesta rakyat resmi dibentuk dengan Alif sebagai Ketua."
                    rows={3.5}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/60 text-foreground font-medium"
                  />
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-4">
                {/* Poin Bahasan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                      📝 Poin Pembahasan Rapat
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addPoinBahasanRow}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer font-bold uppercase"
                    >
                      <PlusCircle className="size-3" /> Tambah Poin
                    </Button>
                  </div>

                  <div className="border border-border/40 rounded-xl max-h-[175px] overflow-y-auto divide-y divide-border/30 p-1.5 bg-muted/5 space-y-1.5">
                    {poinBahasan.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-6">Belum ada poin pembahasan.</p>
                    ) : (
                      poinBahasan.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center pt-2 first:pt-0">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {item.urutan}
                          </span>
                          <Input
                            required
                            placeholder="Apa bahasan agenda ini?"
                            value={item.isi_bahasan}
                            onChange={(e) => updatePoinBahasanValue(idx, "isi_bahasan", e.target.value)}
                            className="h-8 text-xs flex-1 rounded-lg"
                          />
                          <Input
                            placeholder="Pembicara"
                            value={item.pembicara || ""}
                            onChange={(e) => updatePoinBahasanValue(idx, "pembicara", e.target.value)}
                            className="h-8 text-xs w-28 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePoinBahasanRow(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Keputusan Rapat */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                      ⚖️ Keputusan Resmi Rapat
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addKeputusanRow}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer font-bold uppercase"
                    >
                      <PlusCircle className="size-3" /> Tambah Keputusan
                    </Button>
                  </div>

                  <div className="border border-border/40 rounded-xl max-h-[175px] overflow-y-auto divide-y divide-border/30 p-1.5 bg-muted/5 space-y-1.5">
                    {keputusan.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-6">Belum ada keputusan resmi.</p>
                    ) : (
                      keputusan.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center pt-2 first:pt-0">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                            {item.urutan}
                          </span>
                          <Input
                            required
                            placeholder="Hasil Keputusan Rapat"
                            value={item.isi_keputusan}
                            onChange={(e) => updateKeputusanValue(idx, "isi_keputusan", e.target.value)}
                            className="h-8 text-xs flex-1 rounded-lg"
                          />
                          <Input
                            placeholder="Dasar Musyawarah"
                            value={item.dasar_keputusan || ""}
                            onChange={(e) => updateKeputusanValue(idx, "dasar_keputusan", e.target.value)}
                            className="h-8 text-xs w-28 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeKeputusanRow(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Action Items / Tindak Lanjut */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                      🏃‍♂️ Program Tindak Lanjut (Action Items)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addTindakLanjutRow}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer font-bold uppercase"
                    >
                      <PlusCircle className="size-3" /> Tambah Action Item
                    </Button>
                  </div>

                  <div className="border border-border/40 rounded-xl max-h-[175px] overflow-y-auto divide-y divide-border/30 p-1.5 bg-muted/5 space-y-1.5">
                    {tindakLanjut.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-6">Belum ada program tindak lanjut.</p>
                    ) : (
                      tindakLanjut.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center pt-2 first:pt-0">
                          <Input
                            required
                            placeholder="Apa program tindak lanjutnya?"
                            value={item.judul}
                            onChange={(e) => updateTindakLanjutValue(idx, "judul", e.target.value)}
                            className="h-8 text-xs flex-1 rounded-lg"
                          />
                          <Select
                            value={String(item.m_user_id_pic || "1")}
                            onValueChange={(v) => updateTindakLanjutValue(idx, "m_user_id_pic", parseInt(v, 10))}
                          >
                            <SelectTrigger className="h-8 text-[11px] w-28 rounded-lg">
                              <SelectValue placeholder="PIC..." />
                            </SelectTrigger>
                            <SelectContent>
                              {usersData?.data?.map((u) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.nama_lengkap}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={item.prioritas}
                            onValueChange={(v) => updateTindakLanjutValue(idx, "prioritas", v as PrioritasTindakLanjut)}
                          >
                            <SelectTrigger className="h-8 text-[11px] w-20 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TINGGI">Tinggi</SelectItem>
                              <SelectItem value="SEDANG">Sedang</SelectItem>
                              <SelectItem value="RENDAH">Rendah</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() => removeTindakLanjutRow(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="rounded-xl shadow-md cursor-pointer shadow-primary/20"
              >
                {isCreating || isUpdating ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Sahkan Notulen"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl cursor-pointer">
                Batal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle>Hapus Draf Notulen</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-1">
              Apakah Anda yakin ingin menghapus draf notulen{" "}
              <span className="font-semibold text-foreground">"{notulenToDelete?.nomor_notulen}"</span>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isDeleting} className="bg-transparent border-border/50 rounded-xl cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl cursor-pointer shadow-lg shadow-red-600/20"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Draf"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Parent Component with Next.js Suspense boundary to prevent pre-render crashes when reading useSearchParams
export default function NotulenDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <DashboardHeader breadcrumb="Alat / Notulen" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Memuat Halaman Notulen...</p>
          </div>
        </div>
      </div>
    }>
      <NotulenDashboardContent />
    </Suspense>
  );
}
