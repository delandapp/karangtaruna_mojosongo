"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUploadFileMutation } from "@/features/api/storageApi";
import { S3_BUCKETS } from "@/lib/constants";
import { FiUploadCloud, FiX } from "react-icons/fi";

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
  useCreateKasMutation,
  useUpdateKasMutation,
  type Kas,
} from "@/features/api/keuanganApi";

// ─── Options ───────────────────────────────────────────────────────────────
const JENIS_OPTIONS = [
  { value: "masuk", label: "💰 Kas Masuk" },
  { value: "keluar", label: "💸 Kas Keluar" },
];

const KATEGORI_MASUK = [
  "Iuran Anggota",
  "Donasi",
  "Sponsor",
  "Subsidi Pemerintah",
  "Hibah",
  "Dana Kegiatan",
  "Penjualan",
  "Lain-lain Pemasukan",
];

const KATEGORI_KELUAR = [
  "Operasional",
  "Kegiatan / Event",
  "Konsumsi",
  "Transportasi",
  "Perlengkapan",
  "Administrasi",
  "Honorarium",
  "Sosial / Santunan",
  "Pemeliharaan",
  "Lain-lain Pengeluaran",
];

const toNum = (v: unknown) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

const kasFormSchema = z.object({
  jenis_kas: z.enum(["masuk", "keluar"]),
  sumber_tujuan: z.string().min(2, "Sumber/tujuan minimal 2 karakter"),
  kategori: z.string().min(1, "Kategori wajib dipilih"),
  jumlah: z.preprocess(toNum, z.number().min(1, "Jumlah minimal Rp 1")),
  deskripsi: z.string().min(3, "Deskripsi minimal 3 karakter"),
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  bukti_url: z.string().optional().or(z.literal("")),
  catatan: z.string().optional().or(z.literal("")),
});

type KasFormValues = z.infer<typeof kasFormSchema>;

// ─── Props ──────────────────────────────────────────────────────────────────
interface KasFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Kas | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function toDateInputValue(dateStr?: string | null) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export function KasFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: KasFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const [createKas] = useCreateKasMutation();
  const [updateKas] = useUpdateKasMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const form = useForm<KasFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(kasFormSchema) as any,
    defaultValues: {
      jenis_kas: "masuk",
      sumber_tujuan: "",
      kategori: "",
      jumlah: 0,
      deskripsi: "",
      tanggal: new Date().toISOString().split("T")[0],
      bukti_url: "",
      catatan: "",
    },
  });

  const watchJenis = form.watch("jenis_kas");
  const watchJumlah = Number(form.watch("jumlah")) || 0;
  const watchKategori = form.watch("kategori");

  // Autofill and disable sumber_tujuan for "Iuran Anggota"
  useEffect(() => {
    if (watchKategori === "Iuran Anggota") {
      form.setValue("sumber_tujuan", "Anggota Karang Taruna Mojosongo");
    }
  }, [watchKategori, form]);

  // Reset form on open
  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && initialData) {
      const match = initialData.deskripsi.match(/^\[(.*?)\] (.*)$/);
      form.reset({
        jenis_kas: initialData.jenis_kas,
        sumber_tujuan: initialData.sumber_tujuan,
        kategori: match ? match[1] : "",
        jumlah: Number(initialData.jumlah),
        deskripsi: match ? match[2] : initialData.deskripsi,
        tanggal: toDateInputValue(initialData.tanggal),
        bukti_url: initialData.bukti_url || "",
        catatan: initialData.catatan || "",
      });
      const urls = initialData.bukti_url ? initialData.bukti_url.split(",").filter(Boolean) : [];
      setUploadedImages(urls);
    } else {
      form.reset({
        jenis_kas: "masuk",
        sumber_tujuan: "",
        kategori: "",
        jumlah: 0,
        deskripsi: "",
        tanggal: new Date().toISOString().split("T")[0],
        bukti_url: "",
        catatan: "",
      });
      setUploadedImages([]);
    }
  }, [isOpen, isEditing, initialData, form]);

  // Clear kategori when jenis changes
  useEffect(() => {
    if (isOpen && !isEditing) {
      form.setValue("kategori", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchJenis]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error("Format file harus berupa gambar (JPEG, PNG, JPG)");
        continue;
      }
      try {
        const result = await uploadFile({ bucketName: S3_BUCKETS.NOTA, file }).unwrap();
        const rawUrl: string = result?.data?.file?.url || result?.data?.url || result?.data?.s3_url || result?.data?.Location || "";
        const url = rawUrl.startsWith("/")
          ? `${(process.env.NEXT_PUBLIC_S3_API_URL || "https://s3-api.mediatamaedu.com/api/v1/").replace(/\/api\/v1\/?$/, "")}${rawUrl}`
          : rawUrl;
        if (url) {
          setUploadedImages((prev) => [...prev, url]);
          toast.success(`Berhasil mengunggah ${file.name}`);
        } else {
          toast.error(`Gagal mendapatkan URL gambar untuk ${file.name}`);
        }
      } catch (err) {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error("Format file harus berupa gambar (JPEG, PNG, JPG)");
        continue;
      }
      try {
        const result = await uploadFile({ bucketName: S3_BUCKETS.NOTA, file }).unwrap();
        const rawUrl: string = result?.data?.file?.url || result?.data?.url || result?.data?.s3_url || result?.data?.Location || "";
        const url = rawUrl.startsWith("/")
          ? `${(process.env.NEXT_PUBLIC_S3_API_URL || "https://s3-api.mediatamaedu.com/api/v1/").replace(/\/api\/v1\/?$/, "")}${rawUrl}`
          : rawUrl;
        if (url) {
          setUploadedImages((prev) => [...prev, url]);
          toast.success(`Berhasil mengunggah ${file.name}`);
        } else {
          toast.error(`Gagal mendapatkan URL gambar untuk ${file.name}`);
        }
      } catch (err) {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }
  };

  const removeImage = (urlToRemove: string) => {
    setUploadedImages((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const onSubmit = async (values: KasFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        jenis_kas: values.jenis_kas,
        sumber_tujuan: values.sumber_tujuan,
        jumlah: values.jumlah,
        deskripsi: `[${values.kategori}] ${values.deskripsi}`,
        bukti_url: uploadedImages.length > 0 ? uploadedImages.join(",") : undefined,
        tanggal: new Date(values.tanggal).toISOString(),
        catatan: values.catatan || undefined,
      };

      if (isEditing && initialData) {
        await updateKas({ id: initialData.id, body: payload }).unwrap();
        toast.success("✅ Data kas berhasil diperbarui");
      } else {
        await createKas(payload).unwrap();
        toast.success("✅ Data kas berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: unknown) {
      const err = error as { data?: { error?: { message?: string } } };
      toast.error("Gagal menyimpan data kas", {
        description: err?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const kategoriOptions =
    watchJenis === "masuk" ? KATEGORI_MASUK : KATEGORI_KELUAR;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "✏️ Edit Data Kas" : "➕ Tambah Data Kas"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Catat transaksi kas masuk atau kas keluar organisasi secara lengkap dan transparan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

              {/* ── Jenis Kas ── */}
              <FormField
                control={form.control}
                name="jenis_kas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kas <span className="text-destructive">*</span></FormLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {JENIS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all
                            ${field.value === opt.value
                              ? opt.value === "masuk"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm shadow-emerald-500/20"
                                : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 shadow-sm shadow-red-500/20"
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

              {/* ── Kategori + Sumber/Tujuan ── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kategori"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                            <SelectValue placeholder="Pilih kategori..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>
                              {watchJenis === "masuk" ? "Sumber Pemasukan" : "Pos Pengeluaran"}
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

                <FormField
                  control={form.control}
                  name="sumber_tujuan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchJenis === "masuk" ? "Sumber Dana" : "Tujuan Pembayaran"}
                        <span className="text-destructive"> *</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={watchJenis === "masuk" ? "Contoh: Pak Budi, RT 03..." : "Contoh: Toko Maju, Vendor ABC..."}
                          {...field}
                          disabled={watchKategori === "Iuran Anggota"}
                          className="bg-muted/50 focus-visible:ring-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </FormControl>
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
                    <FormLabel>Keterangan / Deskripsi <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Pembayaran sewa aula bulan Juni, Pembelian ATK, dsb."
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* ── Jumlah + Tanggal ── */}
              <Separator className="opacity-50" />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jumlah"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah (Rp) <span className="text-destructive">*</span></FormLabel>
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
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Transaksi <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="bg-muted/50 focus-visible:ring-primary/50"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Amount Preview */}
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${watchJenis === "masuk"
                ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
                }`}>
                <span className="text-sm text-muted-foreground">
                  {watchJenis === "masuk" ? "💰 Total Kas Masuk" : "💸 Total Kas Keluar"}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-sm font-bold ${watchJenis === "masuk"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                >
                  {watchJenis === "masuk" ? "+" : "-"}{formatRupiah(watchJumlah)}
                </Badge>
              </div>

              {/* ── Bukti Upload (Multi-image S3) ── */}
              <div className="space-y-2">
                <FormLabel>Upload Bukti Transaksi <span className="text-[11px] text-muted-foreground font-normal">(Opsional, Bisa beberapa foto)</span></FormLabel>

                {/* Image Previews */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {uploadedImages.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer shadow flex items-center justify-center"
                        >
                          <FiX className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all p-5 text-center cursor-pointer"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <FiUploadCloud className={`size-8 text-muted-foreground mb-2 ${isUploading ? "animate-bounce" : ""}`} />
                  <p className="text-xs font-semibold text-foreground">
                    {isUploading ? "Sedang mengunggah..." : "Klik atau seret file gambar ke sini untuk upload"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, JPEG (Maks. beberapa gambar)</p>
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
                        placeholder="Keterangan tambahan, persetujuan, referensi nomor dokumen, dsb..."
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50 resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 bg-muted/10 border-t border-border/50 shrink-0">
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
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Tambah Data Kas"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
