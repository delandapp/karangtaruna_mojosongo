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
  useCreateAnggaranMutation,
  useUpdateAnggaranMutation,
} from "@/features/api/anggaranApi";

const SKENARIO_OPTIONS = [
  { value: "optimis", label: "Optimis (Skenario Terbaik)" },
  { value: "moderat", label: "Moderat (Realistis)" },
  { value: "konservatif", label: "Konservatif (Skenario Terburuk)" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "diajukan", label: "Diajukan" },
  { value: "disetujui", label: "Disetujui" },
  { value: "final", label: "Final" },
];

const toNum = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

const anggaranFormSchema = z.object({
  skenario: z.string().min(1, "Skenario wajib dipilih"),
  total_pemasukan_rencana: z.preprocess(toNum, z.number().min(0, "Tidak boleh negatif").default(0)),
  total_pengeluaran_rencana: z.preprocess(toNum, z.number().min(0, "Tidak boleh negatif").default(0)),
  persen_cadangan: z.preprocess(toNum, z.number().min(0).max(100).default(10)),
  status: z.string().optional().default("draft"),
  catatan: z.string().max(500).optional().or(z.literal("")),
});

type AnggaranFormValues = z.infer<typeof anggaranFormSchema>;

interface AnggaranFormModalProps {
  eventId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function AnggaranFormModal({
  eventId,
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: AnggaranFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const [createAnggaran] = useCreateAnggaranMutation();
  const [updateAnggaran] = useUpdateAnggaranMutation();

  const form = useForm<AnggaranFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(anggaranFormSchema) as any,
    defaultValues: {
      skenario: "moderat",
      total_pemasukan_rencana: 0,
      total_pengeluaran_rencana: 0,
      persen_cadangan: 10,
      status: "draft",
      catatan: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && initialData) {
      form.reset({
        skenario: initialData.skenario,
        total_pemasukan_rencana: Number(initialData.total_pemasukan_rencana) || 0,
        total_pengeluaran_rencana: Number(initialData.total_pengeluaran_rencana) || 0,
        persen_cadangan: Number(initialData.persen_cadangan) || 10,
        status: initialData.status || "draft",
        catatan: initialData.catatan || "",
      });
    } else {
      form.reset({
        skenario: "moderat",
        total_pemasukan_rencana: 0,
        total_pengeluaran_rencana: 0,
        persen_cadangan: 10,
        status: "draft",
        catatan: "",
      });
    }
  }, [isOpen, isEditing, initialData, form]);

  const onSubmit = async (values: AnggaranFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        eventId,
        skenario: values.skenario,
        total_pemasukan_rencana: values.total_pemasukan_rencana,
        total_pengeluaran_rencana: values.total_pengeluaran_rencana,
        persen_cadangan: values.persen_cadangan,
        status: values.status,
        catatan: values.catatan || undefined,
      };

      if (isEditing) {
        await updateAnggaran({ id: initialData.id, eventId, body: payload }).unwrap();
        toast.success("Anggaran berhasil diperbarui");
      } else {
        await createAnggaran({ eventId, body: payload }).unwrap();
        toast.success("Rancangan Anggaran berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan anggaran", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Anggaran" : "Buat Rancangan Anggaran"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isEditing
              ? "Perbarui rincian rancangan anggaran."
              : "Masukkan perkiraan pemasukan dan pengeluaran untuk event ini."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-2">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="skenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skenario <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih skenario..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SKENARIO_OPTIONS.map((j) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih status..." />
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_pemasukan_rencana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rencana Pemasukan (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_pengeluaran_rencana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rencana Pengeluaran (Rp)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="persen_cadangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proporsi Dana Cadangan (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} placeholder="10" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">Digunakan untuk menghitung dana tak terduga berdasarkan pengeluaran.</p>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Tambahan keterangan untuk skenario anggaran ini..."
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
                {isEditing ? "Simpan Perubahan" : "Simpan Anggaran"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
