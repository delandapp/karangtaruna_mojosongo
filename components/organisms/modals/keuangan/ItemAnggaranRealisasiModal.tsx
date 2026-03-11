"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { TrendingUp, Loader2 } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useUpdateItemAnggaranMutation, type ItemAnggaran } from "@/features/api/keuanganApi";

// ─── Schema ───────────────────────────────────────────────────────────────────
const realisasiSchema = z.object({
  total_realisasi: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0, "Nilai tidak boleh negatif")
  ),
  catatan: z.string().optional().or(z.literal("")),
});

type RealisasiFormValues = z.infer<typeof realisasiSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────
interface ItemAnggaranRealisasiModalProps {
  eventId: number;
  anggaranId: number;
  item: ItemAnggaran | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ItemAnggaranRealisasiModal({
  eventId,
  anggaranId,
  item,
  isOpen,
  onOpenChange,
  onSuccess,
}: ItemAnggaranRealisasiModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateItem] = useUpdateItemAnggaranMutation();

  const rencana = item ? Number(item.total_rencana) : 0;
  const currentRealisasi = item?.total_realisasi != null ? Number(item.total_realisasi) : 0;

  const form = useForm<RealisasiFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(realisasiSchema) as any,
    defaultValues: { total_realisasi: currentRealisasi, catatan: item?.catatan || "" },
    values: { total_realisasi: currentRealisasi, catatan: item?.catatan || "" },
  });

  const watchValue = Number(form.watch("total_realisasi")) || 0;
  const selisih = watchValue - rencana;
  const persen = rencana > 0 ? Math.round((watchValue / rencana) * 100) : 0;

  const onSubmit = async (values: RealisasiFormValues) => {
    if (!item) return;
    setIsSubmitting(true);
    try {
      await updateItem({
        id: item.id,
        eventId,
        anggaranId,
        body: {
          total_realisasi: values.total_realisasi,
          catatan: values.catatan || undefined,
        },
      }).unwrap();
      toast.success("Realisasi item berhasil diperbarui");
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal memperbarui realisasi", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle>Input Realisasi Item</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">{item?.deskripsi}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info rencana */}
        <div className="rounded-xl bg-muted/40 border border-border/40 px-4 py-3 grid grid-cols-2 gap-y-2 text-sm mb-2">
          <span className="text-muted-foreground">Jenis</span>
          <span className={`font-medium capitalize ${item?.jenis_item === "pemasukan" ? "text-emerald-600" : "text-red-600"}`}>
            {item?.jenis_item}
          </span>
          <span className="text-muted-foreground">Kategori</span>
          <span className="font-medium">{item?.kategori}</span>
          <span className="text-muted-foreground">Total Rencana</span>
          <span className="font-semibold">{formatRupiah(item?.total_rencana)}</span>
          <span className="text-muted-foreground">Realisasi Saat Ini</span>
          <span className="font-semibold">{formatRupiah(item?.total_realisasi)}</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="total_realisasi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Realisasi (Rp) <span className="text-destructive">*</span></FormLabel>
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
                  <FormDescription className="text-[10px]">Jumlah aktual yang benar-benar terealisasi</FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Live comparison */}
            {rencana > 0 && (
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                selisih >= 0
                  ? "bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800"
              }`}>
                <span className="text-muted-foreground">
                  {selisih >= 0 ? "Surplus dari rencana" : "Defisit dari rencana"}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={selisih >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                    {persen}%
                  </Badge>
                  <span className={`font-semibold ${selisih >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {selisih >= 0 ? "+" : ""}{formatRupiah(selisih)}
                  </span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Keterangan realisasi..." {...field} className="bg-muted/50 resize-none" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-transparent">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/20">
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Simpan Realisasi
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
