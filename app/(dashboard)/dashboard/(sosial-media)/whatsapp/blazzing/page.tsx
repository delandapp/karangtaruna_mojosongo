"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Zap, Plus, Loader2, Trash2, Users, Clock, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, Calendar, MessageSquare,
  Flame, Send, Search,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  useGetDaftarKontakQuery,
  useGetDaftarBlazingQuery,
  useBuatBlazingMutation,
  useHapusBlazingMutation,
} from "@/features/api/sosialMediaApi";
import { BlazzingWA, KontakWA, TipeBlazing } from "@/lib/types/sosial-media.types";

const PLACEHOLDERS = ["{nama}", "{nomor}", "{email}", "{perusahaan}", "{jabatan}", "{catatan}"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    pending:    { label: "Menunggu",    cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300", icon: Clock },
    processing: { label: "Mengirim...", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse", icon: Loader2 },
    sent:       { label: "Terkirim",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400", icon: CheckCircle2 },
    failed:     { label: "Gagal",      cls: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400", icon: XCircle },
  };
  const m = map[status] || map.pending;
  const Icon = m.icon;
  return (
    <Badge className={`${m.cls} rounded-full font-medium gap-1 text-[11px]`}>
      <Icon className="size-3" /> {m.label}
    </Badge>
  );
}

export default function WhatsappBlazzingPage() {
  const [selectedAkunId, setSelectedAkunId] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState<BlazzingWA | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<BlazzingWA | null>(null);
  const [searchKontak, setSearchKontak] = useState("");

  // Form state
  const [form, setForm] = useState({
    nama_kempen: "",
    pesan: "",
    tipe: "instant" as TipeBlazing,
    dijadwalkan_pada: "",
  });
  const [selectedKontakIds, setSelectedKontakIds] = useState<number[]>([]);
  const [customRecipients, setCustomRecipients] = useState(""); // "Nama,62812xxx\nNama2,62813xxx"

  // Platform & accounts
  const { data: platformRes } = useGetDaftarPlatformQuery();
  const waPlatform = platformRes?.data?.find((p) => p.slug.toLowerCase() === "whatsapp");
  const { data: akunRes, isLoading: isLoadingAkun } = useGetAkunByPlatformQuery(waPlatform?.id || 0, { skip: !waPlatform?.id });
  const accounts = (akunRes?.data || []).filter((a) => a.status === "terhubung");
  const effectiveAkunId = selectedAkunId ?? (accounts[0]?.id ?? null);

  // Campaigns + contacts
  const { data: blazzingRes, isLoading: isLoadingBlazing, refetch } = useGetDaftarBlazingQuery(
    { akun_id: effectiveAkunId! },
    { skip: !effectiveAkunId }
  );
  const campaigns = blazzingRes?.data || [];

  const { data: kontakRes } = useGetDaftarKontakQuery(
    { akun_id: effectiveAkunId!, search: searchKontak },
    { skip: !effectiveAkunId || !isCreateOpen }
  );
  const contacts = kontakRes?.data || [];

  const [buatBlazing, { isLoading: isCreating }] = useBuatBlazingMutation();
  const [hapusBlazing, { isLoading: isDeleting }] = useHapusBlazingMutation();

  const toggleKontak = (id: number) => {
    setSelectedKontakIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedKontakIds(contacts.map((k) => k.id));
  const clearAll = () => setSelectedKontakIds([]);

  const parsedCustom = useMemo(() => {
    return customRecipients.split("\n").map((line) => {
      const parts = line.split(",");
      const nama = parts[0]?.trim();
      const nomor_telp = parts[1]?.trim();
      if (!nama || !nomor_telp) return null;
      return { nama, nomor_telp };
    }).filter(Boolean) as { nama: string; nomor_telp: string }[];
  }, [customRecipients]);

  const totalRecipients = selectedKontakIds.length + parsedCustom.length;

  const handleCreate = async () => {
    if (!form.nama_kempen.trim()) { toast.error("Nama kampanye wajib diisi"); return; }
    if (!form.pesan.trim()) { toast.error("Pesan wajib diisi"); return; }
    if (totalRecipients === 0) { toast.error("Pilih minimal satu penerima"); return; }
    if (!effectiveAkunId) { toast.error("Pilih akun WhatsApp terlebih dahulu"); return; }
    if (form.tipe === "scheduled" && !form.dijadwalkan_pada) { toast.error("Waktu jadwal wajib diisi"); return; }

    const kontakPenerima = contacts
      .filter((k) => selectedKontakIds.includes(k.id))
      .map((k) => ({ nama: k.nama, nomor_telp: k.nomor_telp, kontak_id: k.id }));

    const penerima = [...kontakPenerima, ...parsedCustom];

    try {
      await buatBlazing({
        akun_id: effectiveAkunId,
        nama_kempen: form.nama_kempen,
        pesan: form.pesan,
        tipe: form.tipe,
        dijadwalkan_pada: form.tipe === "scheduled" ? form.dijadwalkan_pada : undefined,
        penerima,
      }).unwrap();
      toast.success("✅ Kampanye Blazzing berhasil dibuat!");
      setIsCreateOpen(false);
      setForm({ nama_kempen: "", pesan: "", tipe: "instant", dijadwalkan_pada: "" });
      setSelectedKontakIds([]);
      setCustomRecipients("");
    } catch (e: any) {
      toast.error(e?.data?.message || "Gagal membuat kampanye");
    }
  };

  const handleDelete = async () => {
    if (!deleteCampaign) return;
    try {
      await hapusBlazing(deleteCampaign.id).unwrap();
      toast.success("Kampanye dihapus");
      setIsDeleteOpen(false);
      if (detailCampaign?.id === deleteCampaign.id) setDetailCampaign(null);
    } catch {
      toast.error("Gagal menghapus kampanye");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="size-6 text-orange-500" /> WhatsApp Blazzing
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kirim pesan massal ke kontak — jadwalkan chat undangan, pengumuman, dan kampanye
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!effectiveAkunId}
          className="gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 font-semibold">
          <Plus className="size-4" /> Buat Kampanye
        </Button>
      </div>

      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((acc) => (
            <button key={acc.id} onClick={() => setSelectedAkunId(acc.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${effectiveAkunId === acc.id ? "bg-emerald-600 text-white border-emerald-600" : "border-border/60 text-muted-foreground hover:border-emerald-500/40"}`}>
              {acc.nama_akun}
            </button>
          ))}
        </div>
      )}

      {/* No account */}
      {!isLoadingAkun && accounts.length === 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-5 shrink-0" />
            Tidak ada akun WhatsApp yang terhubung. Silakan hubungkan akun terlebih dahulu di menu <strong>Koneksi Akun</strong>.
          </CardContent>
        </Card>
      )}

      {/* Campaigns list */}
      {effectiveAkunId && (
        <div className="space-y-3">
          {isLoadingBlazing ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-emerald-500" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="border border-border/60 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Zap className="size-12 text-muted-foreground/30 mb-3" />
                <p className="font-semibold text-sm">Belum ada kampanye Blazzing</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Buat kampanye pertama untuk mengirim pesan massal ke kontak WhatsApp Anda.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} size="sm" className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  <Plus className="size-4" /> Buat Kampanye
                </Button>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((c) => (
              <Card key={c.id} className="border border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setDetailCampaign(c)}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{c.nama_kempen}</span>
                      <StatusBadge status={c.status} />
                      <Badge variant="outline" className={`text-[10px] rounded-full ${c.tipe === "scheduled" ? "border-sky-500/40 text-sky-600" : "border-orange-500/40 text-orange-600"}`}>
                        {c.tipe === "scheduled" ? <><Calendar className="size-3 mr-1" />Terjadwal</> : <><Zap className="size-3 mr-1" />Instan</>}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.pesan}</p>
                    {c.dijadwalkan_pada && (
                      <p className="text-[11px] text-sky-600 mt-1 flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(new Date(c.dijadwalkan_pada), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                      </p>
                    )}
                  </div>
                  {c.stats && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1"><Users className="size-3.5" />{c.stats.total}</div>
                      <div className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="size-3.5" />{c.stats.sent}</div>
                      {c.stats.failed > 0 && <div className="flex items-center gap-1 text-red-500"><XCircle className="size-3.5" />{c.stats.failed}</div>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteCampaign(c); setIsDeleteOpen(true); }}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="size-3.5" />
                    </Button>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Flame className="size-5 text-orange-500" /> Buat Kampanye Blazzing
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Kirim pesan massal ke kontak — gunakan <code className="text-xs bg-muted px-1 rounded">{"{nama}"}</code> sebagai placeholder nama penerima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Campaign name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Nama Kampanye *</label>
              <Input value={form.nama_kempen} onChange={(e) => setForm((f) => ({ ...f, nama_kempen: e.target.value }))}
                placeholder="Contoh: Undangan Rapat RT Juni 2026" className="bg-muted/50 focus-visible:ring-emerald-500/50" />
            </div>

            {/* Tipe */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Tipe Pengiriman *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["instant", "scheduled"] as TipeBlazing[]).map((t) => (
                  <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, tipe: t }))}
                    className={`py-2 px-4 rounded-xl text-xs font-medium border transition-all ${form.tipe === t ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-muted/40 text-foreground border-border/50 hover:bg-muted"}`}>
                    {t === "instant" ? "⚡ Kirim Sekarang" : "🕐 Jadwalkan"}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule time */}
            {form.tipe === "scheduled" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Waktu Pengiriman *</label>
                <Input type="datetime-local" value={form.dijadwalkan_pada} onChange={(e) => setForm((f) => ({ ...f, dijadwalkan_pada: e.target.value }))}
                  className="bg-muted/50 focus-visible:ring-emerald-500/50" />
              </div>
            )}

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Pesan *</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {PLACEHOLDERS.map((p) => (
                  <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, pesan: f.pesan + p }))}
                    className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <textarea value={form.pesan} onChange={(e) => setForm((f) => ({ ...f, pesan: e.target.value }))}
                placeholder={"Halo {nama},\n\nKami mengundang Anda untuk hadir dalam rapat RT yang akan diselenggarakan...\n\nTerima kasih 🙏"}
                rows={5} className="w-full rounded-xl border border-input bg-muted/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono" />
            </div>

            {/* Recipient — contacts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Pilih Kontak ({selectedKontakIds.length} dipilih)</label>
                <div className="flex gap-2">
                  <button type="button" onClick={selectAll} className="text-[10px] text-emerald-600 hover:underline">Pilih Semua</button>
                  <span className="text-muted-foreground text-[10px]">·</span>
                  <button type="button" onClick={clearAll} className="text-[10px] text-muted-foreground hover:underline">Hapus Pilihan</button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input placeholder="Cari kontak..." value={searchKontak} onChange={(e) => setSearchKontak(e.target.value)} className="pl-8 h-8 text-xs bg-muted/50" />
              </div>
              <div className="max-h-40 overflow-y-auto border border-border/50 rounded-xl bg-muted/20 divide-y divide-border/30">
                {contacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Tidak ada kontak</p>
                ) : (
                  contacts.map((k) => (
                    <label key={k.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 cursor-pointer">
                      <input type="checkbox" checked={selectedKontakIds.includes(k.id)} onChange={() => toggleKontak(k.id)} className="accent-emerald-600" />
                      <span className="text-xs font-medium flex-1">{k.nama}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{k.nomor_telp}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Custom recipients */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Penerima Manual (opsional)</label>
              <p className="text-[10px] text-muted-foreground">Format: <code className="bg-muted px-1 rounded">Nama,62812xxx</code> per baris</p>
              <textarea value={customRecipients} onChange={(e) => setCustomRecipients(e.target.value)}
                placeholder={"Budi Santoso,6281234567890\nSiti Rahayu,6282345678901"}
                rows={3} className="w-full rounded-xl border border-input bg-muted/50 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none" />
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 p-3 flex items-center gap-2 text-xs">
              <Send className="size-4 text-emerald-600 shrink-0" />
              <span>Total <strong className="text-emerald-700 dark:text-emerald-400">{totalRecipients} penerima</strong> akan dikirimi pesan ini.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-border/40 mt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating} className="bg-transparent border-border/50">Batal</Button>
            <Button onClick={handleCreate} disabled={isCreating} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold gap-2 shadow-md">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
              {form.tipe === "instant" ? "Kirim Sekarang" : "Jadwalkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      {detailCampaign && (
        <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="size-5 text-emerald-500" /> {detailCampaign.nama_kempen}
              </DialogTitle>
              <div className="flex gap-2 flex-wrap"><StatusBadge status={detailCampaign.status} /></div>
            </DialogHeader>
            <div className="bg-muted/40 rounded-xl p-3 text-sm font-mono whitespace-pre-wrap border border-border/40 mb-4">
              {detailCampaign.pesan}
            </div>
            {detailCampaign.stats && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Total", val: detailCampaign.stats.total, cls: "text-foreground" },
                  { label: "Terkirim", val: detailCampaign.stats.sent, cls: "text-emerald-600" },
                  { label: "Gagal", val: detailCampaign.stats.failed, cls: "text-red-500" },
                  { label: "Pending", val: detailCampaign.stats.pending, cls: "text-amber-600" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/40 border border-border/40 p-3 text-center">
                    <p className={`text-xl font-bold ${s.cls}`}>{s.val}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {(detailCampaign.penerima || []).map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 text-xs">
                  {p.status === "sent" ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" /> : p.status === "failed" ? <XCircle className="size-3.5 text-red-500 shrink-0" /> : <Clock className="size-3.5 text-muted-foreground shrink-0" />}
                  <span className="font-medium flex-1">{p.nama}</span>
                  <span className="text-muted-foreground font-mono">{p.nomor_telp}</span>
                  {p.dikirim_pada && <span className="text-muted-foreground text-[10px]">{format(new Date(p.dikirim_pada), "HH:mm")}</span>}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirm */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-semibold text-destructive">🗑️ Hapus Kampanye</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Kampanye <strong>{deleteCampaign?.nama_kempen}</strong> dan semua data penerima akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="bg-transparent">Batal</Button>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="font-semibold gap-2">
              {isDeleting && <Loader2 className="size-4 animate-spin" />} Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
