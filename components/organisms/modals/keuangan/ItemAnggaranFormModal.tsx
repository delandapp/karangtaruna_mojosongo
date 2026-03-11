"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calculator, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  useCreateItemAnggaranMutation,
  useUpdateItemAnggaranMutation,
  ItemAnggaran,
} from "@/features/api/keuanganApi";

// ─── Options ───────────────────────────────────────────────────────────────
const JENIS_OPTIONS = [
  { value: "pemasukan", label: "💰 Pemasukan (Uang Masuk)" },
  { value: "pengeluaran", label: "💸 Pengeluaran (Uang Keluar)" },
];

const KATEGORI_PEMASUKAN = [
  "Sponsor Utama",
  "Sponsor Pendukung",
  "Tiket Masuk",
  "Donasi",
  "Subsidi Organisasi",
  "Hibah",
  "Lain-lain Pemasukan",
];

const KATEGORI_PENGELUARAN = [
  "Venue & Tempat",
  "Sound System & Lighting",
  "Dekorasi",
  "Konsumsi",
  "Publikasi & Promosi",
  "Perlengkapan Acara",
  "Honorarium",
  "Transportasi",
  "Dokumentasi",
  "Administrasi & Perizinan",
  "Kebersihan & Keamanan",
  "Teknologi & Streaming",
  "Lain-lain Pengeluaran",
];

const toNum = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const itemAnggaranFormSchema = z.object({
  jenis_item: z.enum(["pemasukan", "pengeluaran"]),
  kategori: z.string().min(1, "Kategori wajib dipilih"),
  kode_item: z.string().optional().or(z.literal("")),
  deskripsi: z.string().min(3, "Deskripsi minimal 3 karakter"),
  jumlah_satuan: z.preprocess(toNum, z.number().int().min(1, "Minimal 1 satuan").default(1)),
  harga_satuan_rencana: z.preprocess(toNum, z.number().min(0, "Harga tidak boleh negatif").default(0)),
  catatan: z.string().optional().or(z.literal("")),
});

type ItemAnggaranFormValues = z.infer<typeof itemAnggaranFormSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────
interface ItemAnggaranFormModalProps {
  eventId: number;
  anggaranId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: ItemAnggaran | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ItemAnggaranFormModal({
  eventId,
  anggaranId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: ItemAnggaranFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const [createItem] = useCreateItemAnggaranMutation();
  const [updateItem] = useUpdateItemAnggaranMutation();

  const form = useForm<ItemAnggaranFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(itemAnggaranFormSchema) as any,
    defaultValues: {
      jenis_item: "pengeluaran",
      kategori: "",
      kode_item: "",
      deskripsi: "",
      jumlah_satuan: 1,
      harga_satuan_rencana: 0,
      catatan: "",
    },
  });

  // ── Watch live values for total calculation ────────────────────────────────
  const watchJenis = form.watch("jenis_item");
  const watchQty = Number(form.watch("jumlah_satuan")) || 0;
  const watchHarga = Number(form.watch("harga_satuan_rencana")) || 0;
  const totalRencana = watchQty * watchHarga;

  // ── Reset form when modal opens ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && initialData) {
      form.reset({
        jenis_item: initialData.jenis_item,
        kategori: initialData.kategori,
        kode_item: initialData.kode_item || "",
        deskripsi: initialData.deskripsi,
        jumlah_satuan: initialData.jumlah_satuan,
        harga_satuan_rencana: Number(initialData.harga_satuan_rencana),
        catatan: initialData.catatan || "",
      });
    } else {
      form.reset({
        jenis_item: "pengeluaran",
        kategori: "",
        kode_item: "",
        deskripsi: "",
        jumlah_satuan: 1,
        harga_satuan_rencana: 0,
        catatan: "",
      });
    }
  }, [isOpen, isEditing, initialData, form]);

  // ── Clear kategori when jenis changes ─────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isEditing) {
      form.setValue("kategori", "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchJenis]);

  const onSubmit = async (values: ItemAnggaranFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        jenis_item: values.jenis_item,
        kategori: values.kategori,
        kode_item: values.kode_item || undefined,
        deskripsi: values.deskripsi,
        jumlah_satuan: values.jumlah_satuan,
        harga_satuan_rencana: values.harga_satuan_rencana,
        catatan: values.catatan || undefined,
      };

      if (isEditing && initialData) {
        await updateItem({ id: initialData.id, eventId, anggaranId, body: payload }).unwrap();
        toast.success("✅ Item Anggaran berhasil diperbarui");
      } else {
        await createItem({ eventId, anggaranId, body: payload }).unwrap();
        toast.success("✅ Item Anggaran berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan item anggaran", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const kategoriOptions =
    watchJenis === "pemasukan" ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "✏️ Edit Item Anggaran" : "➕ Tambah Item Anggaran"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Rincian pos anggaran untuk skenario ini. Isi jenis, kategori, dan jumlah estimasi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-2">

            {/* ── Jenis Item ── */}
            <FormField
              control={form.control}
              name="jenis_item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Item <span className="text-destructive">*</span></FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {JENIS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all
                          ${field.value === opt.value
                            ? opt.value === "pemasukan"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Kategori + Kode Item ── */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="kategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                            <SelectValue placeholder="Pilih kategori pos..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              {watchJenis === "pemasukan" ? "Sumber Pemasukan" : "Pos Pengeluaran"}
                            </SelectLabel>
                            {kategoriOptions.map((k) => (
                              <SelectItem key={k} value={k}>{k}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="kode_item"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Item</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A1, B2..."
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50 uppercase"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">Opsional, untuk laporan</FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Deskripsi ── */}
            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi / Nama Item <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Sewa Panggung Utama 8x6m, DP Vendor Catering, dsb."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Qty + Harga Satuan + Total Preview ── */}
            <Separator className="opacity-50" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Estimasi Biaya / Nilai
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jumlah_satuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah / Qty <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          {...field}
                          className="bg-muted/50 focus-visible:ring-primary/50"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">Jumlah unit/satuan</FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="harga_satuan_rencana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Satuan (Rp) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rp</span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...field}
                            className="pl-8 bg-muted/50 focus-visible:ring-primary/50"
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px]">Estimasi per unit</FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Total Preview */}
              <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 ${
                watchJenis === "pemasukan"
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  <span>Total Rencana ({watchQty} × {formatRupiah(watchHarga)})</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-sm font-bold ${
                    watchJenis === "pemasukan"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {watchJenis === "pemasukan" ? "+" : "-"}{formatRupiah(totalRencana)}
                </Badge>
              </div>
            </div>

            {/* ── Catatan ── */}
            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Tambahan</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Keterangan tambahan, referensi vendor, asumsi harga, dsb..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-transparent border-border/50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
