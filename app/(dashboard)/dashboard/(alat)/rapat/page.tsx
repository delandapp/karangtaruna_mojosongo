"use client";

import { useState, useCallback } from "react";
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
  Globe,
  Video,
  FileText,
  Trash2,
  Pencil,
  MoreHorizontal,
  Eye,
  PlusCircle,
  X,
  Users,
  AlertCircle,
  HelpCircle,
  FileSignature,
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
  useGetRapatQuery,
  useCreateRapatMutation,
  useUpdateRapatMutation,
  useDeleteRapatMutation,
  type Rapat,
  type AgendaItem,
  type PesertaItem,
  type StatusRapat,
  type JenisRapat,
  type StatusKehadiran,
} from "@/features/api/rapatApi";
import { useGetEventsQuery } from "@/features/api/eventApi";
import { useGetUsersQuery } from "@/features/api/userApi";

const LIMIT = 10;

const STATUS_RAPAT_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "TERJADWAL", label: "Terjadwal" },
  { value: "BERLANGSUNG", label: "Berlangsung" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DIBATALKAN", label: "Dibatalkan" },
  { value: "DITUNDA", label: "Ditunda" },
];

const JENIS_RAPAT_OPTIONS = [
  { value: "INTERNAL", label: "Internal" },
  { value: "EKSTERNAL", label: "Eksternal" },
  { value: "KOORDINASI", label: "Koordinasi" },
  { value: "EVALUASI", label: "Evaluasi" },
  { value: "DARURAT", label: "Darurat" },
  { value: "LAINNYA", label: "Lainnya" },
];

const KATEGORI_RAPAT_OPTIONS = [
  { id: 1, name: "Rapat Koordinasi" },
  { id: 2, name: "Evaluasi Bulanan" },
  { id: 3, name: "Rapat Sosialisasi / Umum" },
];

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    TERJADWAL: { label: "Terjadwal", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    BERLANGSUNG: { label: "Berlangsung", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    SELESAI: { label: "Selesai", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    DIBATALKAN: { label: "Batal", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    DITUNDA: { label: "Ditunda", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400" },
  };
  const config = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge variant="secondary" className={`text-[11px] font-semibold tracking-wide ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function getJenisBadge(jenis: string) {
  const colors: Record<string, string> = {
    INTERNAL: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    EKSTERNAL: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
    KOORDINASI: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800",
    EVALUASI: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
    DARURAT: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  };
  const className = colors[jenis] ?? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  return (
    <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 px-2 rounded-full border ${className}`}>
      {jenis}
    </Badge>
  );
}

export default function RapatDashboardPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRapat, setSelectedRapat] = useState<Rapat | null>(null);

  // Modals state
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rapatToDelete, setRapatToDelete] = useState<Rapat | null>(null);

  // Form input state
  const [isEditMode, setIsEditMode] = useState(false);
  const [formRapatId, setFormRapatId] = useState<number | null>(null);
  
  const [judulRapat, setJudulRapat] = useState("");
  const [kategoriId, setKategoriId] = useState("1");
  const [eventId, setEventId] = useState("none");
  const [jenisRapat, setJenisRapat] = useState<JenisRapat>("KOORDINASI");
  const [statusRapat, setStatusRapat] = useState<StatusRapat>("TERJADWAL");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [linkOnline, setLinkOnline] = useState("");
  const [nomorRapat, setNomorRapat] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  // Agendas in form
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  // Peserta in form
  const [peserta, setPeserta] = useState<PesertaItem[]>([]);

  // ── Queries and Mutations ──────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetRapatQuery({
    page,
    limit: LIMIT,
    status: statusFilter !== "all" ? (statusFilter as StatusRapat) : undefined,
    search: search || undefined,
  });

  const { data: eventsData } = useGetEventsQuery({ limit: 100 });
  const { data: usersData } = useGetUsersQuery({ limit: 100 });

  const [createRapat, { isLoading: isCreating }] = useCreateRapatMutation();
  const [updateRapat, { isLoading: isUpdating }] = useUpdateRapatMutation();
  const [deleteRapat, { isLoading: isDeleting }] = useDeleteRapatMutation();

  const records = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const pages = meta?.totalPages ?? 1;
  const hasFilter = search || statusFilter !== "all";

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

  // Add agenda row to form
  const addAgendaRow = () => {
    setAgendas([
      ...agendas,
      {
        urutan: agendas.length + 1,
        judul_agenda: "",
        deskripsi: "",
        durasi_menit: 30,
        m_user_id: null,
      },
    ]);
  };

  // Remove agenda row
  const removeAgendaRow = (index: number) => {
    const updated = agendas.filter((_, i) => i !== index);
    // Re-index urutan
    const reindexed = updated.map((item, idx) => ({ ...item, urutan: idx + 1 }));
    setAgendas(reindexed);
  };

  // Update agenda value
  const updateAgendaValue = (index: number, key: keyof AgendaItem, value: any) => {
    const updated = [...agendas];
    updated[index] = { ...updated[index], [key]: value };
    setAgendas(updated);
  };

  // Add participant row to form
  const addPesertaRow = () => {
    setPeserta([
      ...peserta,
      {
        m_user_id: null,
        nama_peserta: "",
        jabatan_peserta: "",
        instansi: "Karang Taruna Mojosongo",
        status_kehadiran: "DIUNDANG",
        is_moderator: false,
        is_notulis: false,
      },
    ]);
  };

  // Remove participant row
  const removePesertaRow = (index: number) => {
    setPeserta(peserta.filter((_, i) => i !== index));
  };

  // Update participant value
  const updatePesertaValue = (index: number, key: keyof PesertaItem, value: any) => {
    const updated = [...peserta];
    updated[index] = { ...updated[index], [key]: value };
    setPeserta(updated);
  };

  // Open Create Form
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormRapatId(null);
    setJudulRapat("");
    setKategoriId("1");
    setEventId("none");
    setJenisRapat("KOORDINASI");
    setStatusRapat("TERJADWAL");
    setDeskripsi("");
    setTanggalMulai(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setTanggalSelesai(format(new Date(Date.now() + 2 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"));
    setLokasi("Sekretariat Karang Taruna Mojosongo");
    setIsOnline(false);
    setLinkOnline("");
    setNomorRapat(`SRT-RPT-${format(new Date(), "yyyyMMdd")}-${Math.floor(100 + Math.random() * 900)}`);
    setIsRecurring(false);
    setAgendas([
      { urutan: 1, judul_agenda: "Pembukaan dan Doa", durasi_menit: 10, deskripsi: "" },
      { urutan: 2, judul_agenda: "Pembahasan Agenda Utama", durasi_menit: 60, deskripsi: "" },
      { urutan: 3, judul_agenda: "Tanya Jawab & Diskusi", durasi_menit: 30, deskripsi: "" },
      { urutan: 4, judul_agenda: "Penutup", durasi_menit: 10, deskripsi: "" },
    ]);
    setPeserta([
      { nama_peserta: "Deland", jabatan_peserta: "Ketua", status_kehadiran: "DIUNDANG", is_moderator: true, is_notulis: false },
      { nama_peserta: "Kezia", jabatan_peserta: "Sekretaris", status_kehadiran: "DIUNDANG", is_moderator: false, is_notulis: true },
      { nama_peserta: "Alif", jabatan_peserta: "Wakil Ketua", status_kehadiran: "DIUNDANG", is_moderator: false, is_notulis: false },
    ]);
    setFormOpen(true);
  };

  // Open Edit Form
  const openEditModal = (rapat: Rapat) => {
    setIsEditMode(true);
    setFormRapatId(rapat.id);
    setJudulRapat(rapat.judul_rapat);
    setKategoriId(String(rapat.m_kategori_rapat_id ?? 1));
    setEventId(rapat.event_id ? String(rapat.event_id) : "none");
    setJenisRapat(rapat.jenis_rapat);
    setStatusRapat(rapat.status_rapat);
    setDeskripsi(rapat.deskripsi ?? "");
    setTanggalMulai(format(new Date(rapat.tanggal_mulai), "yyyy-MM-dd'T'HH:mm"));
    setTanggalSelesai(rapat.tanggal_selesai ? format(new Date(rapat.tanggal_selesai), "yyyy-MM-dd'T'HH:mm") : "");
    setLokasi(rapat.lokasi ?? "");
    setIsOnline(rapat.is_online);
    setLinkOnline(rapat.link_online ?? "");
    setNomorRapat(rapat.nomor_rapat ?? "");
    setIsRecurring(rapat.is_recurring);

    // Agendas
    if (rapat.agendas && rapat.agendas.length > 0) {
      setAgendas(rapat.agendas.map(a => ({ ...a })));
    } else {
      setAgendas([]);
    }

    // Peserta
    if (rapat.peserta && rapat.peserta.length > 0) {
      setPeserta(rapat.peserta.map(p => ({ ...p })));
    } else {
      setPeserta([]);
    }

    setFormOpen(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulRapat || !tanggalMulai) {
      toast.error("Judul rapat dan tanggal mulai wajib diisi!");
      return;
    }

    const payload = {
      judul_rapat: judulRapat,
      m_kategori_rapat_id: parseInt(kategoriId, 10),
      event_id: eventId === "none" ? null : parseInt(eventId, 10),
      jenis_rapat: jenisRapat,
      status_rapat: statusRapat,
      deskripsi: deskripsi || null,
      tanggal_mulai: new Date(tanggalMulai).toISOString(),
      tanggal_selesai: tanggalSelesai ? new Date(tanggalSelesai).toISOString() : null,
      lokasi: lokasi || null,
      is_online: isOnline,
      link_online: isOnline ? linkOnline : null,
      nomor_rapat: nomorRapat || null,
      is_recurring: isRecurring,
      agendas: agendas.map((a) => ({
        urutan: a.urutan,
        judul_agenda: a.judul_agenda,
        deskripsi: a.deskripsi || null,
        durasi_menit: a.durasi_menit ? Number(a.durasi_menit) : null,
        m_user_id: a.m_user_id || null,
      })),
      peserta: peserta.map((p) => ({
        m_user_id: p.m_user_id || null,
        nama_peserta: p.nama_peserta,
        jabatan_peserta: p.jabatan_peserta || null,
        instansi: p.instansi || null,
        email: p.email || null,
        no_handphone: p.no_handphone || null,
        status_kehadiran: p.status_kehadiran,
        is_moderator: p.is_moderator,
        is_notulis: p.is_notulis,
      })),
    };

    try {
      if (isEditMode && formRapatId) {
        await updateRapat({ id: formRapatId, body: payload }).unwrap();
        toast.success("Rapat berhasil diperbarui!");
      } else {
        await createRapat(payload).unwrap();
        toast.success("Rapat baru berhasil dibuat!");
      }
      setFormOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(isEditMode ? "Gagal memperbarui rapat" : "Gagal membuat rapat", {
        description: err?.data?.error?.message || "Format data tidak valid atau ada kendala sistem",
      });
    }
  };

  // Open Delete Dialog
  const openDeleteDialog = (rapat: Rapat) => {
    setRapatToDelete(rapat);
    setDeleteOpen(true);
  };

  // Execute Delete
  const handleDelete = async () => {
    if (!rapatToDelete) return;
    try {
      await deleteRapat(rapatToDelete.id).unwrap();
      toast.success("Rapat berhasil dihapus");
      setDeleteOpen(false);
      setRapatToDelete(null);
      refetch();
    } catch (err: any) {
      toast.error("Gagal menghapus rapat", {
        description: err?.data?.error?.message || "Terjadi kesalahan sistem",
      });
    }
  };

  // Open Detail Modal
  const openDetail = (rapat: Rapat) => {
    setSelectedRapat(rapat);
    setDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader breadcrumb="Alat / Rapat" />

      <div className="flex flex-col gap-6 p-6">
        {/* Page title section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="size-6 text-primary" /> Manajemen Jadwal Rapat
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Jadwalkan, kelola peserta, susun agenda rapat, serta pantau koordinasi organisasi
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
          >
            <Plus className="size-4" /> Buat Rapat Baru
          </Button>
        </div>

        {/* Stat summaries */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Jadwal Rapat", value: total, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
            { label: "Terjadwal", value: records.filter((r) => r.status_rapat === "TERJADWAL").length, icon: Clock, color: "text-blue-600", bg: "bg-blue-100/55 dark:bg-blue-950/30" },
            { label: "Selesai", value: records.filter((r) => r.status_rapat === "SELESAI").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100/55 dark:bg-emerald-950/30" },
            { label: "Berlangsung", value: records.filter((r) => r.status_rapat === "BERLANGSUNG").length, icon: Video, color: "text-amber-600", bg: "bg-amber-100/55 dark:bg-amber-950/30" },
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

        {/* Toolbar filter */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari judul rapat, deskripsi, atau lokasi..."
              className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-muted/40 border-border/60 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_RAPAT_OPTIONS.map((o) => (
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
            {isLoading ? "..." : total} rapat
          </Badge>
        </div>

        {/* Table representation */}
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
                <Calendar className="size-12" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-lg">Tidak ada jadwal rapat</p>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {hasFilter ? "Coba sesuaikan kata kunci pencarian atau status filter Anda." : "Jadwalkan rapat pertama Karang Taruna Anda sekarang!"}
                </p>
              </div>
              {!hasFilter && (
                <Button size="sm" onClick={openCreateModal} className="mt-2 gap-2 rounded-xl cursor-pointer">
                  <Plus className="size-4" /> Buat Rapat
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="pl-6 w-[250px]">Judul Rapat</TableHead>
                  <TableHead>Kategori & Jenis</TableHead>
                  <TableHead>Waktu Mulai</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Notulen</TableHead>
                  <TableHead className="w-[52px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rapat: Rapat) => (
                  <TableRow
                    key={rapat.id}
                    className="hover:bg-muted/30 cursor-pointer group transition-colors"
                    onClick={() => openDetail(rapat)}
                  >
                    <TableCell className="pl-6">
                      <div>
                        <p className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {rapat.judul_rapat}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {rapat.nomor_rapat ?? "Tanpa nomor"}
                          {rapat.event ? ` · Event: ${rapat.event.nama_event}` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs text-foreground font-medium">
                          {rapat.kategori?.nama_kategori ?? "Rapat Koordinasi"}
                        </span>
                        {getJenisBadge(rapat.jenis_rapat)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {format(new Date(rapat.tanggal_mulai), "d MMMM yyyy", { locale: localeId })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          pukul {format(new Date(rapat.tanggal_mulai), "HH:mm")} WIB
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 max-w-[180px]">
                        {rapat.is_online ? (
                          <>
                            <Globe className="size-3.5 text-blue-500 shrink-0" />
                            <span className="text-sm text-foreground truncate">Daring (Online)</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="size-3.5 text-red-500 shrink-0" />
                            <span className="text-sm text-foreground truncate">{rapat.lokasi ?? "Sekretariat"}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(rapat.status_rapat)}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      {rapat.notulen ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 text-[10px] font-bold rounded-lg cursor-pointer px-2 py-0.5"
                          onClick={() => {
                            window.location.href = `/dashboard/notulen?id=${rapat.notulen?.id}`;
                          }}
                        >
                          📝 FINAL
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground/60 hover:text-primary hover:bg-primary/5 text-[10px] font-bold rounded-lg cursor-pointer px-2 py-0.5 transition-colors border-dashed"
                          onClick={() => {
                            window.location.href = `/dashboard/notulen?action=create&rapat_id=${rapat.id}`;
                          }}
                        >
                          + Notulen
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg cursor-pointer">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl">
                          <DropdownMenuItem onClick={() => openDetail(rapat)}>
                            <Eye className="mr-2 size-4" /> Detail Rapat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(rapat)}>
                            <Pencil className="mr-2 size-4" /> Edit Rapat
                          </DropdownMenuItem>
                          {rapat.status_rapat !== "SELESAI" && (
                            <DropdownMenuItem
                              onClick={() => {
                                updateRapat({ id: rapat.id, body: { status_rapat: "SELESAI" } });
                                toast.success("Status rapat diubah menjadi selesai");
                                refetch();
                              }}
                              className="text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-900/20"
                            >
                              <CheckCircle2 className="mr-2 size-4" /> Selesaikan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(rapat)}
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

        {/* Pagination section */}
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

      {/* Rapat Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl max-h-[85vh] overflow-y-auto">
          {selectedRapat && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {getJenisBadge(selectedRapat.jenis_rapat)}
                  {getStatusBadge(selectedRapat.status_rapat)}
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {selectedRapat.judul_rapat}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Nomor Surat Rapat: <span className="font-semibold">{selectedRapat.nomor_rapat ?? "—"}</span>
                </DialogDescription>
              </DialogHeader>

              <Separator className="my-4 opacity-50" />

              {/* Rapat Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Tanggal Pelaksanaan</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {format(new Date(selectedRapat.tanggal_mulai), "eeee, d MMMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Waktu Rapat</p>
                    <p className="font-medium text-foreground mt-0.5">
                      pukul {format(new Date(selectedRapat.tanggal_mulai), "HH:mm")}
                      {selectedRapat.tanggal_selesai ? ` - ${format(new Date(selectedRapat.tanggal_selesai), "HH:mm")}` : ""} WIB
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-4" />
                  </div>
                  <div className="max-w-[220px]">
                    <p className="text-xs text-muted-foreground font-medium">Lokasi Pelaksanaan</p>
                    <p className="font-medium text-foreground mt-0.5 truncate">
                      {selectedRapat.is_online ? "Daring (Online)" : (selectedRapat.lokasi ?? "Sekretariat")}
                    </p>
                  </div>
                </div>

                {selectedRapat.is_online && selectedRapat.link_online && (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                      <Globe className="size-4" />
                    </div>
                    <div className="max-w-[220px]">
                      <p className="text-xs text-muted-foreground font-medium">Tautan Pertemuan</p>
                      <a
                        href={selectedRapat.link_online}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-medium text-xs truncate mt-0.5 block"
                      >
                        {selectedRapat.link_online}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedRapat.deskripsi && (
                <div className="mb-5 bg-muted/20 border border-border/40 p-4 rounded-2xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Deskripsi Rapat
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRapat.deskripsi}</p>
                </div>
              )}

              {/* Agenda Tab */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  📋 Agenda Rapat
                </p>
                {selectedRapat.agendas && selectedRapat.agendas.length > 0 ? (
                  <div className="border border-border/40 rounded-2xl overflow-hidden divide-y divide-border/30 bg-muted/5">
                    {selectedRapat.agendas.map((agenda: AgendaItem) => (
                      <div key={agenda.id} className="p-3.5 flex items-start gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {agenda.urutan}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{agenda.judul_agenda}</p>
                          {agenda.deskripsi && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{agenda.deskripsi}</p>
                          )}
                        </div>
                        {agenda.durasi_menit && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 border-border shrink-0">
                            ⏱️ {agenda.durasi_menit} menit
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Belum ada agenda rapat yang disusun.</p>
                )}
              </div>

              {/* Peserta Tab */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  👥 Daftar Peserta ({selectedRapat.peserta?.length ?? 0} Orang)
                </p>
                {selectedRapat.peserta && selectedRapat.peserta.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRapat.peserta.map((peserta: PesertaItem) => (
                      <div
                        key={peserta.id}
                        className="p-3 rounded-2xl border border-border/40 bg-muted/5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {peserta.nama_peserta}
                            {peserta.is_moderator && (
                              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-[9px] font-extrabold px-1 rounded">MOD</Badge>
                            )}
                            {peserta.is_notulis && (
                              <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 text-[9px] font-extrabold px-1 rounded">NOTULIS</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{peserta.jabatan_peserta ?? "Anggota"}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            peserta.status_kehadiran === "HADIR"
                              ? "bg-emerald-100 text-emerald-700 font-semibold text-[10px]"
                              : peserta.status_kehadiran === "IZIN"
                              ? "bg-sky-100 text-sky-700 font-semibold text-[10px]"
                              : "bg-slate-100 text-slate-700 font-semibold text-[10px]"
                          }
                        >
                          {peserta.status_kehadiran}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic px-2 py-1">Belum ada peserta yang diundang.</p>
                )}
              </div>

              <Separator className="my-5 opacity-50" />

              <DialogFooter className="gap-2 sm:gap-0">
                {selectedRapat.notulen ? (
                  <Button
                    onClick={() => {
                      window.location.href = `/dashboard/notulen?id=${selectedRapat.notulen?.id}`;
                    }}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer"
                  >
                    <FileSignature className="size-4" /> Lihat Notulen Rapat
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      window.location.href = `/dashboard/notulen?action=create&rapat_id=${selectedRapat.id}`;
                    }}
                    className="gap-2 bg-gradient-to-r from-primary to-violet-600 text-white hover:from-primary/95 hover:to-violet-600/95 rounded-xl shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    <FileText className="size-4" /> Susun Notulen Rapat
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailOpen(false)} className="rounded-xl cursor-pointer">
                  Tutup
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rapat Create / Edit Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {isEditMode ? "✍️ Edit Jadwal Rapat" : "🗓️ Buat Rapat Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi rancangan pelaksanaan rapat untuk mengoordinasikan kegiatan pengurus
              </DialogDescription>
            </DialogHeader>

            <Separator className="opacity-50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    Judul Rapat <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    value={judulRapat}
                    onChange={(e) => setJudulRapat(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi Program Pesta Rakyat"
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Kategori Rapat
                    </label>
                    <Select value={kategoriId} onValueChange={setKategoriId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KATEGORI_RAPAT_OPTIONS.map((k) => (
                          <SelectItem key={k.id} value={String(k.id)}>{k.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Hubungkan Event
                    </label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tanpa Hubungan Event</SelectItem>
                        {eventsData?.data?.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.nama_event}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Jenis Rapat
                    </label>
                    <Select value={jenisRapat} onValueChange={(v) => setJenisRapat(v as JenisRapat)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_RAPAT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Status Rapat
                    </label>
                    <Select value={statusRapat} onValueChange={(v) => setStatusRapat(v as StatusRapat)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_RAPAT_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Tanggal & Waktu Mulai <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      type="datetime-local"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Tanggal & Waktu Selesai
                    </label>
                    <Input
                      type="datetime-local"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 py-1 bg-muted/20 border border-border/30 rounded-xl px-4 justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isOnlineCheck"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                      className="size-4 text-primary focus:ring-primary rounded border-border"
                    />
                    <label htmlFor="isOnlineCheck" className="text-xs font-bold text-foreground block cursor-pointer">
                      Laksanakan Secara Online
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isRecurringCheck"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="size-4 text-primary focus:ring-primary rounded border-border"
                    />
                    <label htmlFor="isRecurringCheck" className="text-xs font-bold text-foreground block cursor-pointer">
                      Rapat Rutin (Recurring)
                    </label>
                  </div>
                </div>

                {isOnline ? (
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Tautan Rapat (Zoom/GMeet Link)
                    </label>
                    <Input
                      value={linkOnline}
                      onChange={(e) => setLinkOnline(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="rounded-xl"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                      Lokasi / Tempat Rapat
                    </label>
                    <Input
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      placeholder="Contoh: Balai Pertemuan Kelurahan Mojosongo"
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                    Nomor Surat / Rapat
                  </label>
                  <Input
                    value={nomorRapat}
                    onChange={(e) => setNomorRapat(e.target.value)}
                    placeholder="SRT-RPT-2026-001"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block mb-1.5">
                    Deskripsi / Tujuan Rapat
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Tuliskan tujuan pembahasan atau deskripsi singkat rapat..."
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-border/60"
                  />
                </div>

                {/* Agendas list block */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                      📋 Susunan Agenda Rapat
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addAgendaRow}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer font-bold uppercase"
                    >
                      <PlusCircle className="size-3" /> Tambah Agenda
                    </Button>
                  </div>

                  <div className="border border-border/40 rounded-xl max-h-[220px] overflow-y-auto divide-y divide-border/30 p-1.5 bg-muted/5 space-y-1.5">
                    {agendas.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-6">Belum menyusun agenda rapat.</p>
                    ) : (
                      agendas.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center pt-2 first:pt-0">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {item.urutan}
                          </span>
                          <Input
                            required
                            placeholder="Judul Agenda Rapat"
                            value={item.judul_agenda}
                            onChange={(e) => updateAgendaValue(idx, "judul_agenda", e.target.value)}
                            className="h-8 text-xs flex-1 rounded-lg"
                          />
                          <Input
                            type="number"
                            placeholder="Min"
                            value={item.durasi_menit || ""}
                            onChange={(e) => updateAgendaValue(idx, "durasi_menit", e.target.value ? parseInt(e.target.value, 10) : null)}
                            className="h-8 text-xs w-16 text-center rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeAgendaRow(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Peserta list block */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider block">
                      👥 Undang Peserta Rapat
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={addPesertaRow}
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1 cursor-pointer font-bold uppercase"
                    >
                      <PlusCircle className="size-3" /> Tambah Peserta
                    </Button>
                  </div>

                  <div className="border border-border/40 rounded-xl max-h-[220px] overflow-y-auto divide-y divide-border/30 p-1.5 bg-muted/5 space-y-1.5">
                    {peserta.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic text-center py-6">Belum mengundang peserta rapat.</p>
                    ) : (
                      peserta.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center pt-2 first:pt-0">
                          <Input
                            required
                            placeholder="Nama Lengkap"
                            value={item.nama_peserta}
                            onChange={(e) => updatePesertaValue(idx, "nama_peserta", e.target.value)}
                            className="h-8 text-xs flex-1 rounded-lg"
                          />
                          <Input
                            placeholder="Jabatan"
                            value={item.jabatan_peserta || ""}
                            onChange={(e) => updatePesertaValue(idx, "jabatan_peserta", e.target.value)}
                            className="h-8 text-xs w-28 rounded-lg"
                          />
                          <Select
                            value={item.status_kehadiran}
                            onValueChange={(v) => updatePesertaValue(idx, "status_kehadiran", v as StatusKehadiran)}
                          >
                            <SelectTrigger className="h-8 text-[11px] w-28 rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIUNDANG">Diundang</SelectItem>
                              <SelectItem value="HADIR">Hadir</SelectItem>
                              <SelectItem value="IZIN">Izin</SelectItem>
                              <SelectItem value="TIDAK_HADIR">Absen</SelectItem>
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() => removePesertaRow(idx)}
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
                {isCreating || isUpdating ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Jadwalkan Rapat"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl cursor-pointer">
                Batal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rapat Delete Confirm Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle>Hapus Jadwal Rapat</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-1">
              Apakah Anda yakin ingin menghapus jadwal rapat{" "}
              <span className="font-semibold text-foreground">"{rapatToDelete?.judul_rapat}"</span>? Tindakan ini bersifat permanen dan akan menghapus agenda serta relasi rapat terkait.
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
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
