"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2, RefreshCw,
  Eye, Archive, CheckCircle2, Clock, FileText, Zap, Star,
  Filter, Globe, EyeOff,
} from "lucide-react";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/molecules/TablePagination";
import { BeritaDeleteModal } from "../modals/berita/BeritaDeleteModal";

import {
  useGetBeritaListQuery,
  usePublishBeritaMutation,
  type Berita,
  type StatusBerita,
} from "@/features/api/beritaApi";

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusBerita, { label: string; className: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground border-border/60", icon: <FileText className="h-3 w-3" /> },
  REVIEW: { label: "Review", className: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: <Clock className="h-3 w-3" /> },
  SCHEDULED: { label: "Terjadwal", className: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: <Clock className="h-3 w-3" /> },
  PUBLISHED: { label: "Terbit", className: "bg-primary/10 text-primary border-primary/30", icon: <CheckCircle2 className="h-3 w-3" /> },
  ARCHIVED: { label: "Arsip", className: "bg-muted text-muted-foreground border-border/60", icon: <Archive className="h-3 w-3" /> },
  REJECTED: { label: "Ditolak", className: "bg-destructive/10 text-destructive border-destructive/30", icon: <EyeOff className="h-3 w-3" /> },
};

// ─── Quick Action Menu ────────────────────────────────────────────────────────

function QuickActionMenu({ berita, onRefetch }: { berita: Berita; onRefetch: () => void }) {
  const [publishBerita] = usePublishBeritaMutation();

  const handleAction = async (action: "PUBLISH" | "ARCHIVE" | "REJECT" | "REVIEW" | "DRAFT") => {
    try {
      await publishBerita({ id: berita.id, action }).unwrap();
      const labels: Record<string, string> = {
        PUBLISH: "diterbitkan", ARCHIVE: "diarsipkan", REJECT: "ditolak",
        REVIEW: "dikirim ke review", DRAFT: "dikembalikan ke draft",
      };
      toast.success(`Berita berhasil ${labels[action]}`);
      onRefetch();
    } catch (error: any) {
      toast.error("Gagal mengubah status", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    }
  };

  return (
    <>
      {berita.status !== "PUBLISHED" && (
        <DropdownMenuItem onClick={() => handleAction("PUBLISH")} className="cursor-pointer text-primary focus:text-primary focus:bg-primary/10">
          <Globe className="mr-2 h-4 w-4" /> Terbitkan
        </DropdownMenuItem>
      )}
      {berita.status !== "REVIEW" && berita.status !== "PUBLISHED" && (
        <DropdownMenuItem onClick={() => handleAction("REVIEW")} className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-500/10">
          <Clock className="mr-2 h-4 w-4" /> Kirim Review
        </DropdownMenuItem>
      )}
      {berita.status === "PUBLISHED" && (
        <DropdownMenuItem onClick={() => handleAction("ARCHIVE")} className="cursor-pointer text-muted-foreground">
          <Archive className="mr-2 h-4 w-4" /> Arsipkan
        </DropdownMenuItem>
      )}
      {berita.status !== "DRAFT" && (
        <DropdownMenuItem onClick={() => handleAction("DRAFT")} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4" /> Kembalikan ke Draft
        </DropdownMenuItem>
      )}
    </>
  );
}

// ─── BeritaTable ──────────────────────────────────────────────────────────────

export function BeritaTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusBerita | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingBerita, setDeletingBerita] = useState<Pick<Berita, "id" | "judul"> | null>(null);

  const {
    data: response, isFetching: loading, refetch,
  } = useGetBeritaListQuery({
    page,
    limit,
    search: searchQuery || undefined,
    status: filterStatus !== "ALL" ? filterStatus : undefined,
  });

  const beritaList = response?.data || [];
  const totalPages = response?.meta?.totalPages || 0;

  const handleCreate = useCallback(() => {
    router.push("/dashboard/berita/buat");
  }, [router]);

  const handleEdit = useCallback((b: Berita) => {
    router.push(`/dashboard/berita/edit/${b.id}`);
  }, [router]);

  const handleDelete = useCallback((b: Berita) => {
    setDeletingBerita({ id: b.id, judul: b.judul });
    setDeleteOpen(true);
  }, []);

  const onDeleteSuccess = useCallback(() => {
    setDeleteOpen(false);
    setDeletingBerita(null);
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul berita..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50"
            />
          </div>

          {/* Filter Status */}
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as any); setPage(1); }}>
            <SelectTrigger className="w-40 bg-card/50 backdrop-blur border-border/50 focus:ring-primary/50">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
              <SelectItem value="ALL">Semua Status</SelectItem>
              {(Object.keys(STATUS_CONFIG) as StatusBerita[]).map((s) => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    {STATUS_CONFIG[s].icon}
                    {STATUS_CONFIG[s].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline" size="icon"
            onClick={() => refetch()}
            disabled={loading}
            className="shrink-0 bg-card/50 backdrop-blur border-border/50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-muted-foreground" : "text-foreground"}`} />
          </Button>
        </div>

        <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all shrink-0">
          <Plus className="h-4 w-4" />
          Tulis Berita
        </Button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-foreground font-semibold w-14">Cover</TableHead>
              <TableHead className="text-foreground font-semibold">Berita</TableHead>
              <TableHead className="text-foreground font-semibold w-32">Kategori</TableHead>
              <TableHead className="text-foreground font-semibold w-28">Status</TableHead>
              <TableHead className="text-foreground font-semibold w-28 text-right">Views</TableHead>
              <TableHead className="text-foreground font-semibold w-32">Terbit</TableHead>
              <TableHead className="text-right text-foreground font-semibold w-16">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Memuat data berita...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : beritaList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm">Tidak ada berita yang ditemukan.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              beritaList.map((b) => {
                const cover = b.c_berita_cover?.find((c) => c.is_primary);
                const statusCfg = STATUS_CONFIG[b.status];
                return (
                  <TableRow key={b.id} className="group hover:bg-muted/40 border-border/40 transition-colors">
                    {/* Cover */}
                    <TableCell>
                      <div className="h-10 w-14 overflow-hidden rounded-lg bg-muted">
                        {cover?.s3_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.s3_url} alt={b.judul} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Judul */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {b.is_featured && (
                            <Star className="h-3 w-3 text-amber-500 shrink-0" />
                          )}
                          {b.is_breaking_news && (
                            <Zap className="h-3 w-3 text-destructive shrink-0" />
                          )}
                          <p className="font-medium text-foreground line-clamp-1 text-sm">{b.judul}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {b.penulis} · /{b.seo_slug}
                        </p>
                      </div>
                    </TableCell>

                    {/* Kategori */}
                    <TableCell>
                      {b.m_kategori_berita && (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: b.m_kategori_berita.warna_hex ? `${b.m_kategori_berita.warna_hex}50` : undefined,
                            color: b.m_kategori_berita.warna_hex || undefined,
                            backgroundColor: b.m_kategori_berita.warna_hex ? `${b.m_kategori_berita.warna_hex}15` : undefined,
                          }}
                        >
                          {b.m_kategori_berita.nama}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge variant="outline" className={`text-xs gap-1 ${statusCfg.className}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </TableCell>

                    {/* Views */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {Number(b.total_views).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </TableCell>

                    {/* Tanggal */}
                    <TableCell>
                      <p className="text-xs text-muted-foreground">
                        {b.published_at
                          ? format(new Date(b.published_at), "dd MMM yyyy", { locale: localeId })
                          : b.status === "SCHEDULED" && b.scheduled_at
                            ? `⏰ ${format(new Date(b.scheduled_at), "dd MMM", { locale: localeId })}`
                            : "—"
                        }
                      </p>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-100 transition-opacity">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 border-border/50 bg-card/95 backdrop-blur-xl">
                          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Aksi Berita</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem onClick={() => handleEdit(b)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" /> Edit Berita
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <QuickActionMenu berita={b} onRefetch={refetch} />
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem onClick={() => handleDelete(b)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {!loading && totalPages > 0 && (
          <TablePagination
            currentPage={page} totalPages={totalPages}
            onPageChange={setPage} limit={limit}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* ── Delete Modal ── */}
      <BeritaDeleteModal
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onDeleteSuccess}
        berita={deletingBerita}
      />
    </div>
  );
}
