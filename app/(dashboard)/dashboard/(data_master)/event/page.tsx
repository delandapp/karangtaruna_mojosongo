"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarX2,
  Trash2,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useGetEventsQuery,
  useDeleteEventMutation,
  type JenisEvent,
  type StatusEvent,
} from "@/features/api/eventApi";
import { EventCard, EventCardData } from "@/components/organisms/cards/EventCard";
import { EventFormModal } from "@/components/organisms/modals/EventFormModal";

// ── Filter options ─────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "all",         label: "Semua Status"   },
  { value: "perencanaan", label: "Perencanaan"    },
  { value: "persiapan",   label: "Persiapan"      },
  { value: "siap",        label: "Siap"           },
  { value: "berlangsung", label: "Berlangsung"    },
  { value: "selesai",     label: "Selesai"        },
  { value: "dibatalkan",  label: "Dibatalkan"     },
];

const JENIS_OPTIONS = [
  { value: "all",         label: "Semua Jenis"    },
  { value: "festival",    label: "Festival"       },
  { value: "lomba",       label: "Lomba"          },
  { value: "seminar",     label: "Seminar"        },
  { value: "bakti_sosial",label: "Bakti Sosial"   },
  { value: "olahraga",    label: "Olahraga"       },
  { value: "seni_budaya", label: "Seni & Budaya"  },
  { value: "pelatihan",   label: "Pelatihan"      },
  { value: "lainnya",     label: "Lainnya"        },
];

const LIMIT = 12;

export default function EventPage() {
  // ── State ──────────────────────────────────────────────
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState("");
  const [searchInput, setSearchInput]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [jenisFilter, setJenisFilter]     = useState("all");

  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editTarget, setEditTarget]       = useState<EventCardData | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<EventCardData | null>(null);

  // ── Query ──────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetEventsQuery({
    page,
    limit: LIMIT,
    search: search || undefined,
    status_event: statusFilter !== "all" ? (statusFilter as StatusEvent) : undefined,
    jenis_event:  jenisFilter  !== "all" ? (jenisFilter  as JenisEvent)  : undefined,
  });

  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  const events: EventCardData[] = (data?.data as EventCardData[]) ?? [];
  const meta   = data?.meta;
  const total  = meta?.total   ?? 0;
  const pages  = meta?.totalPages ?? 1;

  // ── Handlers ───────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput);
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleEdit = (event: EventCardData) => {
    setEditTarget(event);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditTarget(null);
    refetch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id).unwrap();
      toast.success("Event dihapus", {
        description: `${deleteTarget.nama_event} berhasil dihapus.`,
      });
      setDeleteTarget(null);
      if (events.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch (error: any) {
      toast.error("Gagal menghapus event", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("all");
    setJenisFilter("all");
    setPage(1);
  };

  const hasFilter = search || statusFilter !== "all" || jenisFilter !== "all";

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-6 p-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Event
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola seluruh kegiatan dan event organisasi
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Plus className="size-4" />
          Buat Event
        </Button>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="event-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari nama / kode event..."
            className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/40"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 bg-muted/40 border-border/60">
            <SlidersHorizontal className="mr-2 size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Jenis filter */}
        <Select value={jenisFilter} onValueChange={(v) => { setJenisFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44 bg-muted/40 border-border/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JENIS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        {hasFilter && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10 gap-1.5 text-muted-foreground hover:text-foreground">
            Reset filter
          </Button>
        )}

        {/* Total badge */}
        <div className="flex items-center ml-auto">
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {isLoading ? "..." : total} event
          </Badge>
        </div>
      </div>

      {/* ── Card grid ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-8 animate-spin text-primary/50" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <CalendarX2 className="size-16 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-foreground">Belum ada event</p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasFilter ? "Tidak ada event yang cocok dengan filter." : "Mulai buat event pertama Anda!"}
            </p>
          </div>
          {hasFilter ? (
            <Button variant="outline" size="sm" onClick={resetFilters}>Reset Filter</Button>
          ) : (
            <Button size="sm" onClick={handleCreate} className="gap-2">
              <Plus className="size-4" /> Buat Event
            </Button>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Halaman <span className="font-medium text-foreground">{page}</span> dari <span className="font-medium text-foreground">{pages}</span>
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

      {/* ── Form Modal ── */}
      <EventFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        initialData={editTarget}
      />

      {/* ── Delete Confirm Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              Hapus Event
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus event{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.nama_event}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
