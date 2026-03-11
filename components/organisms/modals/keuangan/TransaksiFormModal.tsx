"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  useCreateTransaksiKeuanganMutation,
  useUpdateTransaksiKeuanganMutation,
  TransaksiKeuangan,
  useGetItemAnggaranQuery,
} from "@/features/api/keuanganApi";
import { format } from "date-fns";

const JENIS_OPTIONS = [
  { value: "pemasukan", label: "Pemasukan (Uang Masuk)" },
  { value: "pengeluaran", label: "Pengeluaran (Uang Keluar)" },
];

const STATUS_OPTIONS = [
  { value: "menunggu_persetujuan", label: "Menunggu Persetujuan" },
  { value: "disetujui", label: "Disisihkan / Disetujui" },
  { value: "dibayar", label: "Sudah Dibayar/Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

const toNum = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

const transaksiFormSchema = z.object({
  item_anggaran_id: z.string().optional().nullable(),
  jenis_transaksi: z.enum(["pemasukan", "pengeluaran"]),
  jumlah: z.preprocess(toNum, z.number().min(0).default(0)),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  bukti_url: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
  tanggal_transaksi: z.string().min(1, "Tanggal wajib diisi"),
  status: z.enum(["menunggu_persetujuan", "disetujui", "ditolak", "dibayar"]).optional(),
  catatan: z.string().optional().or(z.literal("")),
});

type TransaksiFormValues = z.infer<typeof transaksiFormSchema>;

interface TransaksiFormModalProps {
  eventId: number;
  anggaranId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: TransaksiKeuangan | null;
}

export function TransaksiFormModal({
  eventId,
  anggaranId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: TransaksiFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const [createTransaksi] = useCreateTransaksiKeuanganMutation();
  const [updateTransaksi] = useUpdateTransaksiKeuanganMutation();
  const { data: itemResponse } = useGetItemAnggaranQuery(
    { eventId, anggaranId },
    { skip: !isOpen || !anggaranId }
  );

  const items = itemResponse?.data || [];

  const form = useForm<TransaksiFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(transaksiFormSchema) as any,
    defaultValues: {
      item_anggaran_id: "none",
      jenis_transaksi: "pengeluaran",
      jumlah: 0,
      deskripsi: "",
      bukti_url: "",
      tanggal_transaksi: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status: "menunggu_persetujuan",
      catatan: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && initialData) {
      form.reset({
        item_anggaran_id: initialData.item_anggaran_id ? String(initialData.item_anggaran_id) : "none",
        jenis_transaksi: initialData.jenis_transaksi,
        jumlah: Number(initialData.jumlah),
        deskripsi: initialData.deskripsi,
        bukti_url: initialData.bukti_url || "",
        tanggal_transaksi: initialData.tanggal_transaksi
          ? format(new Date(initialData.tanggal_transaksi), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: initialData.status,
        catatan: initialData.catatan || "",
      });
    } else {
      form.reset({
        item_anggaran_id: "none",
        jenis_transaksi: "pengeluaran",
        jumlah: 0,
        deskripsi: "",
        bukti_url: "",
        tanggal_transaksi: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: "menunggu_persetujuan",
        catatan: "",
      });
    }
  }, [isOpen, isEditing, initialData, form]);

  const onSubmit = async (values: TransaksiFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        anggaran_id: anggaranId,
        item_anggaran_id: values.item_anggaran_id !== "none" ? Number(values.item_anggaran_id) : undefined,
        jenis_transaksi: values.jenis_transaksi,
        jumlah: values.jumlah,
        deskripsi: values.deskripsi,
        bukti_url: values.bukti_url || undefined,
        tanggal_transaksi: new Date(values.tanggal_transaksi).toISOString(),
        status: isEditing ? values.status : undefined,
        catatan: values.catatan || undefined,
      };

      if (isEditing && initialData) {
        await updateTransaksi({ id: initialData.id, body: payload }).unwrap();
        toast.success("Catatan Transaksi berhasil diperbarui");
      } else {
        await createTransaksi(payload).unwrap();
        toast.success("Catatan Transaksi baru berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan transaksi", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Transaksi" : "Catat Transaksi Baru"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Catat pemasukan atau pengeluaran ke dalam sistem. Anda bisa mengaitkan transaksi ini ke rincian Item Anggaran.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-2">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jenis_transaksi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Transaksi <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih jenis..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JENIS_OPTIONS.map((j) => (
                          <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tanggal_transaksi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Transaksi <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="item_anggaran_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kaitkan dengan Item Anggaran (Opsional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                        <SelectValue placeholder="Pilih rincian anggaran..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground italic">-- Tidak ada (Transaksi Bebas) --</SelectItem>
                      {items.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>
                          [{j.kategori}] {j.deskripsi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Transaksi <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: DP Pembayaran Panggung" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jumlah"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nominal Aktual (Rp) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Persetujuan</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                            <SelectValue placeholder="Status..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((j) => (
                            <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="bukti_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lampiran Bukti (URL)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://link-bukti.com/nota123.jpg" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan Tambahan</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Info tambahan..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

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
                {isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
