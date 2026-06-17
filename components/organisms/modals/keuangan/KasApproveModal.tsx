"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApproveKasMutation, type Kas } from "@/features/api/keuanganApi";

const approveSchema = z.object({
  catatan: z.string().optional(),
});

type ApproveValues = z.infer<typeof approveSchema>;

interface KasApproveModalProps {
  kas: Kas | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function formatRupiah(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Rp 0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

export function KasApproveModal({
  kas,
  isOpen,
  onOpenChange,
  onSuccess,
}: KasApproveModalProps) {
  const [approveKas] = useApproveKasMutation();
  const [actionType, setActionType] = useState<"disetujui" | "ditolak" | null>(null);

  const form = useForm<ApproveValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(approveSchema) as any,
    defaultValues: { catatan: "" },
  });

  const handleAction = async (status: "disetujui" | "ditolak") => {
    if (!kas) return;
    setActionType(status);
    try {
      const catatan = form.getValues("catatan");
      await approveKas({ id: kas.id, body: { status, catatan: catatan || undefined } }).unwrap();
      toast.success(
        status === "disetujui"
          ? "✅ Kas berhasil disetujui"
          : "❌ Kas berhasil ditolak"
      );
      form.reset();
      onSuccess();
    } catch (error: unknown) {
      const err = error as { data?: { error?: { message?: string } } };
      toast.error("Gagal memproses persetujuan", {
        description: err?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setActionType(null);
    }
  };

  const isLoading = actionType !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Persetujuan Kas</DialogTitle>
          <DialogDescription>
            Tinjau dan setujui atau tolak transaksi kas ini.
          </DialogDescription>
        </DialogHeader>

        {kas && (
          <div className="space-y-4">
            {/* Kas Detail Card */}
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Nomor</span>
                <span className="text-sm font-mono font-semibold text-foreground">{kas.nomor_kas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jenis</span>
                <Badge
                  variant="secondary"
                  className={kas.jenis_kas === "masuk"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}
                >
                  {kas.jenis_kas === "masuk" ? "💰 Kas Masuk" : "💸 Kas Keluar"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {kas.jenis_kas === "masuk" ? "Dari" : "Kepada"}
                </span>
                <span className="text-sm font-medium text-foreground">{kas.sumber_tujuan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Jumlah</span>
                <span className={`text-lg font-bold ${kas.jenis_kas === "masuk" ? "text-emerald-600" : "text-red-600"}`}>
                  {kas.jenis_kas === "masuk" ? "+" : "-"}{formatRupiah(kas.jumlah)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Keterangan</span>
                <span className="text-sm text-foreground text-right">{kas.deskripsi}</span>
              </div>
              {kas.dicatat_oleh && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dicatat Oleh</span>
                  <span className="text-sm text-muted-foreground">{kas.dicatat_oleh.nama_lengkap}</span>
                </div>
              )}
            </div>

            {/* Catatan field */}
            <Form {...form}>
              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Persetujuan</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="Opsional — tambahkan catatan persetujuan atau alasan penolakan..."
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50 resize-none"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </Form>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1 bg-transparent border-border/50"
              >
                Batal
              </Button>
              <Button
                onClick={() => handleAction("ditolak")}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20"
              >
                {actionType === "ditolak"
                  ? <Loader2 className="mr-2 size-4 animate-spin" />
                  : <XCircle className="mr-2 size-4" />}
                Tolak
              </Button>
              <Button
                onClick={() => handleAction("disetujui")}
                disabled={isLoading}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
              >
                {actionType === "disetujui"
                  ? <Loader2 className="mr-2 size-4 animate-spin" />
                  : <CheckCircle2 className="mr-2 size-4" />}
                Setujui
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
