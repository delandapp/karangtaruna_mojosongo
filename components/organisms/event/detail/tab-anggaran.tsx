"use client";

import React, { useState, useCallback, useRef } from "react";
import { type Anggaran } from "@/features/api/anggaranApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Pencil, Trash2, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { AnggaranFormModal } from "@/components/organisms/modals/event/AnggaranFormModal";
import { AnggaranDeleteModal } from "@/components/organisms/modals/event/AnggaranDeleteModal";
import { ItemAnggaranFormModal } from "@/components/organisms/modals/keuangan/ItemAnggaranFormModal";
import { ItemAnggaranDeleteModal } from "@/components/organisms/modals/keuangan/ItemAnggaranDeleteModal";
import { ItemAnggaranRealisasiModal } from "@/components/organisms/modals/keuangan/ItemAnggaranRealisasiModal";
import {
  useGetItemAnggaranQuery,
  type ItemAnggaran,
} from "@/features/api/keuanganApi";

interface TabAnggaranProps {
  eventId: number;
  anggaranList: Anggaran[];
  isLoading: boolean;
  onRegisterAdd?: (fn: () => void) => void;
}

export function TabAnggaran({
  eventId,
  anggaranList,
  isLoading,
  onRegisterAdd,
}: TabAnggaranProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAnggaran, setSelectedAnggaran] = useState<Anggaran | null>(
    null,
  );

  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isItemDeleteOpen, setIsItemDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemAnggaran | null>(null);
  const [activeAnggaranIdForItem, setActiveAnggaranIdForItem] = useState<
    number | null
  >(null);

  const handleOpenForm = useCallback((anggaran?: Anggaran) => {
    setSelectedAnggaran(anggaran || null);
    setIsFormOpen(true);
  }, []);

  const registeredRef = useRef(false);
  React.useEffect(() => {
    if (onRegisterAdd && !registeredRef.current) {
      registeredRef.current = true;
      onRegisterAdd(() => handleOpenForm());
    }
  }, [onRegisterAdd, handleOpenForm]);

  const handleOpenDelete = (anggaran: Anggaran) => {
    setSelectedAnggaran(anggaran);
    setIsDeleteOpen(true);
  };

  const handleOpenItemForm = (anggaranId: number, item?: ItemAnggaran) => {
    setActiveAnggaranIdForItem(anggaranId);
    setSelectedItem(item || null);
    setIsItemFormOpen(true);
  };

  const handleOpenItemDelete = (anggaranId: number, item: ItemAnggaran) => {
    setActiveAnggaranIdForItem(anggaranId);
    setSelectedItem(item);
    setIsItemDeleteOpen(true);
  };

  // ── Realisasi state ────────────────────────────────────────────────────────
  const [isItemRealisasiOpen, setIsItemRealisasiOpen] = useState(false);

  const handleOpenItemRealisasi = (anggaranId: number, item: ItemAnggaran) => {
    setActiveAnggaranIdForItem(anggaranId);
    setSelectedItem(item);
    setIsItemRealisasiOpen(true);
  };

  const formatRupiah = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-slate-500 hover:bg-slate-600";
      case "diajukan":
        return "bg-blue-500 hover:bg-blue-600";
      case "disetujui":
        return "bg-emerald-500 hover:bg-emerald-600";
      case "final":
        return "bg-purple-600 hover:bg-purple-700";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getSkenarioLabel = (skenario: string) => {
    switch (skenario) {
      case "optimis":
        return "Optimis (Skenario Terbaik)";
      case "moderat":
        return "Moderat (Realistis)";
      case "konservatif":
        return "Konservatif (Skenario Terburuk)";
      default:
        return skenario;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Memuat rancangan anggaran...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!anggaranList || anggaranList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground w-full">
            <p className="mb-4">
              Belum ada rancangan anggaran untuk event ini.
            </p>
            <Button variant="default" onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Anggaran
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {anggaranList.map((anggaran) => (
            <Card key={anggaran.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">
                    Skenario: {getSkenarioLabel(anggaran.skenario)}
                  </CardTitle>
                  <CardDescription>Versi {anggaran.versi}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(anggaran.status)}>
                    {anggaran.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenForm(anggaran)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenDelete(anggaran)}
                        className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Rencana Pemasukan
                    </p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(anggaran.total_pemasukan_rencana)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Rencana Pengeluaran
                    </p>
                    <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
                      {formatRupiah(anggaran.total_pengeluaran_rencana)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Cadangan ({Number(anggaran.persen_cadangan)}%)
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {formatRupiah(
                        (Number(anggaran.total_pengeluaran_rencana) *
                          Number(anggaran.persen_cadangan)) /
                          100,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <p className="text-xs font-medium text-muted-foreground">
                      Surplus / Defisit Perkiraan
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold ${Number(anggaran.total_pemasukan_rencana) - Number(anggaran.total_pengeluaran_rencana) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {formatRupiah(
                        Number(anggaran.total_pemasukan_rencana) -
                          Number(anggaran.total_pengeluaran_rencana),
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground border-t pt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Dibuat oleh:</strong>{" "}
                      {anggaran.dibuat_oleh?.nama_lengkap || "-"}
                    </p>
                    <p className="mt-1">
                      <strong>Catatan:</strong> {anggaran.catatan || "-"}
                    </p>
                  </div>
                  <div className="md:text-right">
                    {anggaran.status === "disetujui" ||
                    anggaran.status === "final" ? (
                      <>
                        <p>
                          <strong>Disetujui oleh:</strong>{" "}
                          {anggaran.disetujui_oleh?.nama_lengkap || "-"}
                        </p>
                        <p className="mt-1">
                          <strong>Pada:</strong>{" "}
                          {anggaran.disetujui_pada
                            ? format(
                                new Date(anggaran.disetujui_pada),
                                "dd MMM yyyy, HH:mm",
                                { locale: localeId },
                              )
                            : "-"}
                        </p>
                      </>
                    ) : null}
                  </div>
                </div>

                <ItemAnggaranList
                  eventId={eventId}
                  anggaranId={anggaran.id}
                  onAddItem={() => handleOpenItemForm(anggaran.id)}
                  onEditItem={(item) => handleOpenItemForm(anggaran.id, item)}
                  onDeleteItem={(item) =>
                    handleOpenItemDelete(anggaran.id, item)
                  }
                  onRealisasiItem={(item) =>
                    handleOpenItemRealisasi(anggaran.id, item)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <AnggaranFormModal
        eventId={eventId}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={selectedAnggaran}
        onSuccess={() => setIsFormOpen(false)}
      />

      <AnggaranDeleteModal
        eventId={eventId}
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        dataId={selectedAnggaran?.id || null}
        skenarioName={
          selectedAnggaran ? getSkenarioLabel(selectedAnggaran.skenario) : ""
        }
        onSuccess={() => setIsDeleteOpen(false)}
      />
      <ItemAnggaranFormModal
        eventId={eventId}
        anggaranId={activeAnggaranIdForItem || 0}
        isOpen={isItemFormOpen}
        onOpenChange={setIsItemFormOpen}
        initialData={selectedItem}
        onSuccess={() => setIsItemFormOpen(false)}
      />

      <ItemAnggaranDeleteModal
        eventId={eventId}
        anggaranId={activeAnggaranIdForItem || 0}
        isOpen={isItemDeleteOpen}
        onOpenChange={setIsItemDeleteOpen}
        dataId={selectedItem?.id || null}
        itemName={selectedItem?.deskripsi}
        onSuccess={() => setIsItemDeleteOpen(false)}
      />

      <ItemAnggaranRealisasiModal
        eventId={eventId}
        anggaranId={activeAnggaranIdForItem || 0}
        item={selectedItem}
        isOpen={isItemRealisasiOpen}
        onOpenChange={setIsItemRealisasiOpen}
        onSuccess={() => setIsItemRealisasiOpen(false)}
      />
    </div>
  );
}

function ItemAnggaranList({
  eventId,
  anggaranId,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onRealisasiItem,
}: {
  eventId: number;
  anggaranId: number;
  onAddItem: () => void;
  onEditItem: (item: ItemAnggaran) => void;
  onDeleteItem: (item: ItemAnggaran) => void;
  onRealisasiItem: (item: ItemAnggaran) => void;
}) {
  const { data: response, isLoading } = useGetItemAnggaranQuery({
    eventId,
    anggaranId,
  });

  const formatRupiah = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading)
    return (
      <div className="mt-6 animate-pulse text-sm text-muted-foreground">
        Memuat item anggaran...
      </div>
    );

  const items = response?.data || [];

  // ── Computed totals from items ──────────────────────────────────────────────
  const itemPemasukan = items.filter((i) => i.jenis_item === "pemasukan");
  const itemPengeluaran = items.filter((i) => i.jenis_item === "pengeluaran");

  const totalPemasukanRencana = itemPemasukan.reduce((s, i) => s + Number(i.total_rencana ?? 0), 0);
  const totalPengeluaranRencana = itemPengeluaran.reduce((s, i) => s + Number(i.total_rencana ?? 0), 0);

  const totalPemasukanRealisasi = itemPemasukan.reduce((s, i) => s + Number(i.total_realisasi ?? 0), 0);
  const totalPengeluaranRealisasi = itemPengeluaran.reduce((s, i) => s + Number(i.total_realisasi ?? 0), 0);

  const hasAnyRealisasi = items.some((i) => i.total_realisasi != null);
  const itemsWithRealisasi = items.filter((i) => i.total_realisasi != null).length;
  const progressPct = items.length > 0 ? Math.round((itemsWithRealisasi / items.length) * 100) : 0;

  const surplusDefisitRencana = totalPemasukanRencana - totalPengeluaranRencana;
  const surplusDefisitRealisasi = totalPemasukanRealisasi - totalPengeluaranRealisasi;

  const pengeluaranProgress = totalPengeluaranRencana > 0
    ? Math.min(100, Math.round((totalPengeluaranRealisasi / totalPengeluaranRencana) * 100))
    : 0;

  const pemasukanProgress = totalPemasukanRencana > 0
    ? Math.min(100, Math.round((totalPemasukanRealisasi / totalPemasukanRencana) * 100))
    : 0;

  return (
    <div className="mt-8 border-t pt-6 space-y-6">
      {/* ── Realization Summary Dashboard ── */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground tracking-tight">
                Ringkasan Realisasi Anggaran
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-full px-3 py-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              {itemsWithRealisasi}/{items.length} item terealisasi &bull; {progressPct}%
            </div>
          </div>

          {/* Cards row */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pemasukan */}
            <div className="rounded-xl border bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/10 p-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Pemasukan
              </p>
              <div className="space-y-0.5">
                <p className="text-[11px] text-muted-foreground">Rencana</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 leading-tight">
                  {formatRupiah(totalPemasukanRencana)}
                </p>
              </div>
              {hasAnyRealisasi && (
                <>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Realisasi</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                      {formatRupiah(totalPemasukanRealisasi)}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/50 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pemasukanProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{pemasukanProgress}%</p>
                  </div>
                </>
              )}
            </div>

            {/* Pengeluaran */}
            <div className="rounded-xl border bg-gradient-to-br from-red-50/60 to-red-100/30 dark:from-red-950/30 dark:to-red-900/10 p-4 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-red-700 dark:text-red-400">
                Pengeluaran
              </p>
              <div className="space-y-0.5">
                <p className="text-[11px] text-muted-foreground">Rencana</p>
                <p className="text-base font-bold text-red-700 dark:text-red-400 leading-tight">
                  {formatRupiah(totalPengeluaranRencana)}
                </p>
              </div>
              {hasAnyRealisasi && (
                <>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Realisasi</p>
                    <p className={`text-sm font-semibold ${totalPengeluaranRealisasi > totalPengeluaranRencana ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatRupiah(totalPengeluaranRealisasi)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-red-200/60 dark:bg-red-900/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pengeluaranProgress > 100 ? "bg-red-600" : pengeluaranProgress > 85 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(pengeluaranProgress, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{pengeluaranProgress}%</p>
                  </div>
                </>
              )}
            </div>

            {/* Surplus/Defisit Rencana */}
            <div className={`rounded-xl border p-4 space-y-2 ${surplusDefisitRencana >= 0 ? "bg-gradient-to-br from-blue-50/60 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/10" : "bg-gradient-to-br from-amber-50/60 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10"}`}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Proyeksi (Rencana)
              </p>
              <div className="flex items-start gap-1.5">
                {surplusDefisitRencana >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-1 shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-600 mt-1 shrink-0" />
                )}
                <div>
                  <p className={`text-base font-bold leading-tight ${surplusDefisitRencana >= 0 ? "text-blue-700 dark:text-blue-400" : "text-amber-700 dark:text-amber-400"}`}>
                    {formatRupiah(surplusDefisitRencana)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {surplusDefisitRencana >= 0 ? "Surplus direncanakan" : "Defisit direncanakan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Surplus/Defisit Realisasi */}
            {hasAnyRealisasi ? (
              <div className={`rounded-xl border p-4 space-y-2 ${surplusDefisitRealisasi >= 0 ? "bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-gradient-to-br from-red-50/80 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20 border-red-200 dark:border-red-800"}`}>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Aktual (Realisasi)
                </p>
                <div className="flex items-start gap-1.5">
                  {surplusDefisitRealisasi >= 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-1 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-1 shrink-0" />
                  )}
                  <div>
                    <p className={`text-base font-bold leading-tight ${surplusDefisitRealisasi >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                      {formatRupiah(surplusDefisitRealisasi)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {surplusDefisitRealisasi >= 0 ? "Surplus aktual" : "Defisit aktual"}
                    </p>
                  </div>
                </div>
                {/* Selisih dari rencana */}
                <div className="pt-1 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground">Selisih dari rencana</p>
                  <p className={`text-xs font-semibold ${(surplusDefisitRealisasi - surplusDefisitRencana) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {(surplusDefisitRealisasi - surplusDefisitRencana) >= 0 ? "+" : ""}{formatRupiah(surplusDefisitRealisasi - surplusDefisitRencana)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 space-y-2 bg-muted/20 flex flex-col items-center justify-center text-center">
                <Minus className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-[11px] text-muted-foreground">
                  Belum ada realisasi yang diinput
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Item Table ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground tracking-tight">
            Rincian Item Anggaran
          </h4>
          <Button variant="outline" size="sm" onClick={onAddItem} className="h-8">
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada rincian item anggaran yang ditambahkan
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Vol</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Total Rencana</TableHead>
                  <TableHead className="text-right">Realisasi</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const rencana = Number(item.total_rencana ?? 0);
                  const realisasi = item.total_realisasi != null ? Number(item.total_realisasi) : null;
                  const selisih = realisasi != null ? realisasi - rencana : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {item.kategori}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold ${item.jenis_item === "pemasukan" ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {item.jenis_item}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.deskripsi}</span>
                        {item.catatan && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.catatan}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.jumlah_satuan}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatRupiah(item.harga_satuan_rencana)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatRupiah(item.total_rencana)}
                      </TableCell>
                      <TableCell className="text-right">
                        {realisasi != null ? (
                          <span
                            className={`text-sm font-semibold ${
                              realisasi > rencana
                                ? "text-red-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {formatRupiah(realisasi)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            Belum diisi
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {selisih != null ? (
                          <span className={`text-xs font-semibold ${selisih > 0 ? "text-red-600" : selisih < 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                            {selisih > 0 ? "+" : ""}{formatRupiah(selisih)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onRealisasiItem(item)}
                              className="text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20"
                            >
                              <TrendingUp className="mr-2 h-4 w-4" /> Input
                              Realisasi
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEditItem(item)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteItem(item)}
                              className="text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
