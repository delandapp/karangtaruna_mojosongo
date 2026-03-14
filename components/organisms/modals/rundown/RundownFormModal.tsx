"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/ui/combobox";

import {
  useCreateRundownMutation,
  useUpdateRundownMutation,
  type RundownAcara,
} from "@/features/api/rundownApi";
import { useGetUsersQuery } from "@/features/api/userApi";
import { createRundownSchema, STATUS_RUNDOWN } from "@/lib/validations/rundown.schema";

type FormValues = z.infer<typeof createRundownSchema>;

const STATUS_LABELS: Record<string, string> = {
  belum: "Belum Mulai",
  berjalan: "Sedang Berjalan",
  selesai: "Selesai",
  dilewati: "Dilewati",
};

interface RundownFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  initialData?: RundownAcara | null;
  defaultHariKe?: number;
  onSuccess?: () => void;
}

export function RundownFormModal({
  isOpen,
  onOpenChange,
  eventId,
  initialData,
  defaultHariKe = 1,
  onSuccess,
}: RundownFormModalProps) {
  const isEditing = !!initialData;

  const [createRundown, { isLoading: isCreating }] = useCreateRundownMutation();
  const [updateRundown, { isLoading: isUpdating }] = useUpdateRundownMutation();
  const isLoading = isCreating || isUpdating;

  const { data: usersRes } = useGetUsersQuery({ dropdown: true } as any);
  const userOptions = (usersRes?.data || []).map((u: any) => ({
    id: String(u.id),
    nama: u.nama_lengkap || u.username,
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(createRundownSchema) as any,
    defaultValues: {
      pic_id: null,
      hari_ke: defaultHariKe,
      urutan_no: 1,
      waktu_mulai: "09.00",
      waktu_selesai: "10.00",
      nama_kegiatan: "",
      keterangan: "",
      status: "belum",
    },
  });

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      form.reset({
        pic_id: initialData.pic_id ?? null,
        hari_ke: initialData.hari_ke,
        urutan_no: initialData.urutan_no,
        waktu_mulai: initialData.waktu_mulai,
        waktu_selesai: initialData.waktu_selesai,
        nama_kegiatan: initialData.nama_kegiatan,
        keterangan: initialData.keterangan ?? "",
        status: initialData.status,
      });
    } else {
      form.reset({
        pic_id: null,
        hari_ke: defaultHariKe,
        urutan_no: 1, // You might want to auto-increment this based on existing items
        waktu_mulai: "09.00",
        waktu_selesai: "10.00",
        nama_kegiatan: "",
        keterangan: "",
        status: "belum",
      });
    }
  }, [isOpen, initialData, form, defaultHariKe]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && initialData) {
        await updateRundown({
          eventId,
          id: initialData.id,
          body: values,
        }).unwrap();
        toast.success("Berhasil!", { description: "Data rundown diperbarui." });
      } else {
        await createRundown({ eventId, body: values }).unwrap();
        toast.success("Berhasil!", { description: "Kegiatan rundown ditambahkan." });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menyimpan", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada server.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Kegiatan Rundown" : "Tambah Kegiatan Rundown"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui jadwal detail rundown acara."
              : "Tambahkan kegiatan baru ke jadwal rundown event ini."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            
            {/* Hari & Urutan */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hari_ke"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Hari Ke- <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urutan_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Urutan No <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Waktu */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="waktu_mulai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Waktu Mulai <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] mt-1 text-muted-foreground">Format: HH.MM</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waktu_selesai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Waktu Selesai <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] mt-1 text-muted-foreground">Format: HH.MM</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nama Kegiatan */}
            <FormField
              control={form.control}
              name="nama_kegiatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nama Kegiatan <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Registrasi Peserta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PIC ComboBox */}
            <FormField
              control={form.control}
              name="pic_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person In Charge (PIC)</FormLabel>
                  <FormControl>
                    <ComboBox
                      data={userOptions}
                      selected={field.value ? String(field.value) : ""}
                      onChange={(val: any) => {
                        const id = val && typeof val === "object" ? val.id : val;
                        field.onChange(id ? Number(id) : null);
                      }}
                      title="PIC"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_RUNDOWN.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keterangan */}
            <FormField
              control={form.control}
              name="keterangan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan kegiatan..."
                      className="resize-none h-20"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  "Perbarui"
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
