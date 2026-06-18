"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Search, Upload, Download, Loader2, Pencil, Trash2,
  Users, Phone, Mail, Building2, Tag, StickyNote, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  useGetDaftarKontakQuery,
  useBuatKontakMutation,
  useUpdateKontakMutation,
  useHapusKontakMutation,
  useImportKontakMutation,
} from "@/features/api/sosialMediaApi";
import { KontakWA } from "@/lib/types/sosial-media.types";

// ── Google Contacts CSV parser ────────────────────────────────────────────────
function parseGoogleContactsCSV(csvText: string) {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const idx = (name: string) => headers.findIndex((h) => h.toLowerCase().includes(name.toLowerCase()));

  const nameIdx = idx("Name");
  const givenIdx = idx("Given Name");
  const familyIdx = idx("Family Name");
  const phoneIdx = idx("Phone 1 - Value");
  const emailIdx = idx("E-mail 1 - Value");
  const orgIdx = idx("Organization 1 - Name");
  const titleIdx = idx("Organization 1 - Title");
  const groupIdx = idx("Group Membership");
  const noteIdx = idx("Notes");

  return lines.slice(1).map((line) => {
    // Handle quoted CSV fields
    const fields: string[] = [];
    let inQuote = false, cur = "";
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { fields.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    fields.push(cur.trim());

    const get = (i: number) => (i >= 0 ? fields[i]?.replace(/^"|"$/g, "").trim() : "") || "";
    const nama = get(nameIdx) || `${get(givenIdx)} ${get(familyIdx)}`.trim();
    const nomor_telp = get(phoneIdx);
    if (!nama || !nomor_telp) return null;
    return {
      nama,
      nomor_telp,
      email: get(emailIdx) || undefined,
      perusahaan: get(orgIdx) || undefined,
      jabatan: get(titleIdx) || undefined,
      grup: get(groupIdx) || undefined,
      catatan: get(noteIdx) || undefined,
    };
  }).filter(Boolean) as any[];
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function WhatsappKontakPage() {
  const [selectedAkunId, setSelectedAkunId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editKontak, setEditKontak] = useState<KontakWA | null>(null);
  const [deleteKontak, setDeleteKontak] = useState<KontakWA | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({ nama: "", nomor_telp: "", email: "", perusahaan: "", jabatan: "", grup: "", catatan: "" });

  const { data: platformRes } = useGetDaftarPlatformQuery();
  const waPlatform = platformRes?.data?.find((p) => p.slug.toLowerCase() === "whatsapp");

  const { data: akunRes, isLoading: isLoadingAkun } = useGetAkunByPlatformQuery(waPlatform?.id || 0, {
    skip: !waPlatform?.id,
  });

  const accounts = (akunRes?.data || []).filter((a) => a.status === "terhubung");

  // Auto-select first connected account
  const effectiveAkunId = selectedAkunId ?? (accounts[0]?.id ?? null);

  const { data: kontakRes, isLoading: isLoadingKontak, refetch } = useGetDaftarKontakQuery(
    { akun_id: effectiveAkunId!, search },
    { skip: !effectiveAkunId }
  );

  const contacts = kontakRes?.data || [];

  const [buatKontak, { isLoading: isCreating }] = useBuatKontakMutation();
  const [updateKontak, { isLoading: isUpdating }] = useUpdateKontakMutation();
  const [hapusKontak, { isLoading: isDeleting }] = useHapusKontakMutation();
  const [importKontak, { isLoading: isImporting }] = useImportKontakMutation();

  const isSaving = isCreating || isUpdating;

  const openCreateModal = () => {
    setEditKontak(null);
    setForm({ nama: "", nomor_telp: "", email: "", perusahaan: "", jabatan: "", grup: "", catatan: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (k: KontakWA) => {
    setEditKontak(k);
    setForm({
      nama: k.nama, nomor_telp: k.nomor_telp, email: k.email || "",
      perusahaan: k.perusahaan || "", jabatan: k.jabatan || "",
      grup: k.grup || "", catatan: k.catatan || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.nomor_telp.trim()) {
      toast.error("Nama dan nomor telepon wajib diisi");
      return;
    }
    if (!effectiveAkunId) { toast.error("Pilih akun WhatsApp terlebih dahulu"); return; }
    try {
      if (editKontak) {
        await updateKontak({ id: editKontak.id, ...form }).unwrap();
        toast.success("✅ Kontak berhasil diperbarui");
      } else {
        await buatKontak({ akun_id: effectiveAkunId, ...form }).unwrap();
        toast.success("✅ Kontak berhasil ditambahkan");
      }
      setIsModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Gagal menyimpan kontak");
    }
  };

  const handleDelete = async () => {
    if (!deleteKontak) return;
    try {
      await hapusKontak(deleteKontak.id).unwrap();
      toast.success("Kontak dihapus");
      setIsDeleteOpen(false);
    } catch {
      toast.error("Gagal menghapus kontak");
    }
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !effectiveAkunId) return;
    const text = await file.text();
    const parsed = parseGoogleContactsCSV(text);
    if (parsed.length === 0) { toast.error("Tidak ada kontak valid di file CSV"); return; }
    try {
      const res = await importKontak({ akun_id: effectiveAkunId, contacts: parsed }).unwrap();
      toast.success(`✅ Impor selesai: ${res.data.imported} ditambahkan, ${res.data.skipped} dilewati`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Gagal impor kontak");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [effectiveAkunId, importKontak]);

  const handleExport = () => {
    if (!effectiveAkunId) return;
    window.open(`/api/sosial-media/kontak/export?akun_id=${effectiveAkunId}`, "_blank");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-emerald-500" /> Kontak WhatsApp
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kontak WhatsApp — impor / ekspor format Google Contacts
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting || !effectiveAkunId} className="gap-2 rounded-xl border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            {isImporting ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Impor CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!effectiveAkunId} className="gap-2 rounded-xl">
            <Download className="size-4" /> Ekspor CSV
          </Button>
          <Button size="sm" onClick={openCreateModal} disabled={!effectiveAkunId} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
            <Plus className="size-4" /> Tambah Kontak
          </Button>
        </div>
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

      {/* No connected account */}
      {!isLoadingAkun && accounts.length === 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5 rounded-2xl">
          <CardContent className="flex items-center gap-3 p-5 text-sm text-amber-700 dark:text-amber-400">
            <Users className="size-5 shrink-0" />
            Tidak ada akun WhatsApp yang terhubung. Silakan hubungkan akun terlebih dahulu di menu <strong>Koneksi Akun</strong>.
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      {effectiveAkunId && (
        <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
          <CardHeader className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                📋 Daftar Kontak ({contacts.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {accounts.find((a) => a.id === effectiveAkunId)?.nama_akun}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input placeholder="Cari nama, nomor, email..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-lg bg-muted/50" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingKontak ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-emerald-500" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="size-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-sm">{search ? "Kontak tidak ditemukan" : "Belum ada kontak"}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {search ? "Coba kata kunci lain" : "Tambahkan kontak atau impor dari file CSV Google Contacts."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-xs font-semibold py-3 px-5">Nama</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-5">Nomor HP</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-5 hidden md:table-cell">Email</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-5 hidden lg:table-cell">Perusahaan</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-5 hidden lg:table-cell">Grup</TableHead>
                      <TableHead className="text-xs font-semibold py-3 px-5 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((k) => (
                      <TableRow key={k.id} className="hover:bg-muted/10">
                        <TableCell className="py-3.5 px-5 font-medium text-sm">{k.nama}</TableCell>
                        <TableCell className="py-3.5 px-5 text-sm font-mono text-muted-foreground">{k.nomor_telp}</TableCell>
                        <TableCell className="py-3.5 px-5 text-xs text-muted-foreground hidden md:table-cell">{k.email || "—"}</TableCell>
                        <TableCell className="py-3.5 px-5 text-xs text-muted-foreground hidden lg:table-cell">{k.perusahaan || "—"}</TableCell>
                        <TableCell className="py-3.5 px-5 hidden lg:table-cell">
                          {k.grup ? <Badge variant="outline" className="text-[10px] px-2 rounded-full">{k.grup}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell className="py-3.5 px-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(k)} className="h-7 text-xs px-2.5 rounded-lg gap-1">
                              <Pencil className="size-3" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setDeleteKontak(k); setIsDeleteOpen(true); }}
                              className="h-7 text-xs px-2.5 rounded-lg gap-1 text-destructive hover:bg-destructive/10 border-border/50">
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold">
              {editKontak ? "✏️ Edit Kontak" : "➕ Tambah Kontak"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editKontak ? "Perbarui informasi kontak WhatsApp." : "Tambahkan kontak WhatsApp baru."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              { label: "Nama*", field: "nama", placeholder: "Nama lengkap", icon: Users },
              { label: "Nomor Telepon*", field: "nomor_telp", placeholder: "628xxx (dengan kode negara)", icon: Phone },
              { label: "Email", field: "email", placeholder: "email@contoh.com", icon: Mail },
              { label: "Perusahaan", field: "perusahaan", placeholder: "Nama perusahaan / organisasi", icon: Building2 },
              { label: "Jabatan", field: "jabatan", placeholder: "Jabatan / posisi", icon: Tag },
              { label: "Grup", field: "grup", placeholder: "Nama grup / kategori", icon: Tag },
            ].map(({ label, field, placeholder, icon: Icon }) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="size-3.5 text-muted-foreground" /> {label}
                </label>
                <Input value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder} className="h-9 text-sm bg-muted/50 focus-visible:ring-emerald-500/50" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <StickyNote className="size-3.5 text-muted-foreground" /> Catatan
              </label>
              <textarea value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
                placeholder="Catatan tambahan..." rows={2}
                className="w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40 mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="bg-transparent border-border/50">Batal</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2">
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {editKontak ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-semibold text-destructive">🗑️ Hapus Kontak</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Kontak <strong>{deleteKontak?.nama}</strong> ({deleteKontak?.nomor_telp}) akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting} className="bg-transparent">Batal</Button>
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="font-semibold gap-2">
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
