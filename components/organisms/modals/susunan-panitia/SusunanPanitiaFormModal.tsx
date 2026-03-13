"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/ui/combobox";

import {
  useCreatePanitiaMutation,
  useUpdatePanitiaMutation,
  type AnggotaPanitia,
} from "@/features/api/panitiaApi";
import { useGetUsersQuery } from "@/features/api/userApi";
import { DIVISI_PANITIA, POSISI_PANITIA } from "@/lib/validations/panitia.schema";

// ── Schema ────────────────────────────────────────────────────────────────────
const formSchema = z.object({
  user_id: z.number({ message: "Pilih anggota terlebih dahulu" }).positive({ message: "Pilih anggota terlebih dahulu" }),
  divisi: z.enum(DIVISI_PANITIA, { message: "Pilih divisi" }),
  posisi: z.enum(POSISI_PANITIA, { message: "Pilih posisi" }),
  deskripsi_tugas: z.string().max(2000).optional().nullable(),
  is_aktif: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Labels ────────────────────────────────────────────────────────────────────
const DIVISI_LABELS: Record<string, string> = {
  acara: "Acara",
  logistik: "Logistik",
  humas: "Humas",
  konsumsi: "Konsumsi",
  keamanan: "Keamanan",
  dokumentasi: "Dokumentasi",
  dekorasi: "Dekorasi",
  transportasi: "Transportasi",
  lainnya: "Lainnya",
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface SusunanPanitiaFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  initialData?: AnggotaPanitia | null;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SusunanPanitiaFormModal({
  isOpen,
  onOpenChange,
  eventId,
  initialData,
  onSuccess,
}: SusunanPanitiaFormModalProps) {
  const isEditing = !!initialData;

  const [createPanitia, { isLoading: isCreating }] = useCreatePanitiaMutation();
  const [updatePanitia, { isLoading: isUpdating }] = useUpdatePanitiaMutation();
  const isLoading = isCreating || isUpdating;

  const { data: usersRes } = useGetUsersQuery({ dropdown: true } as any);
  const userOptions = (usersRes?.data || []).map((u: any) => ({
    id: String(u.id),
    nama: u.nama_lengkap || u.username,
  }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      user_id: 0,
      divisi: "acara",
      posisi: "Anggota",
      deskripsi_tugas: "",
      is_aktif: true,
    },
  });

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      form.reset({
        user_id: initialData.user_id,
        divisi: initialData.divisi,
        posisi: initialData.posisi,
        deskripsi_tugas: initialData.deskripsi_tugas ?? "",
        is_aktif: initialData.is_aktif,
      });
    } else {
      form.reset({
        user_id: 0,
        divisi: "acara",
        posisi: "Anggota",
        deskripsi_tugas: "",
        is_aktif: true,
      });
    }
  }, [isOpen, initialData, form]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && initialData) {
        const { user_id: _removed, ...updatePayload } = values;
        await updatePanitia({
          eventId,
          id: initialData.id,
          body: updatePayload,
        }).unwrap();
        toast.success("Berhasil!", { description: "Data panitia diperbarui." });
      } else {
        await createPanitia({ eventId, body: values }).unwrap();
        toast.success("Berhasil!", { description: "Anggota panitia ditambahkan." });
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
      <DialogContent className="sm:max-w-[480px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Anggota Panitia" : "Tambah Anggota Panitia"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui data anggota panitia."
              : "Tambahkan anggota baru ke susunan panitia event ini."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* User ComboBox — hanya saat Create */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Anggota <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboBox
                        data={userOptions}
                        selected={field.value ? String(field.value) : ""}
                        onChange={(val: any) => {
                          const id = val && typeof val === "object" ? val.id : val;
                          field.onChange(id ? Number(id) : 0);
                        }}
                        title="Anggota"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Divisi & Posisi */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="divisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Divisi <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih divisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DIVISI_PANITIA.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DIVISI_LABELS[d] ?? d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="posisi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Posisi <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih posisi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {POSISI_PANITIA.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Deskripsi Tugas */}
            <FormField
              control={form.control}
              name="deskripsi_tugas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Tugas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Uraikan tugas dan tanggung jawab..."
                      className="resize-none h-24"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Aktif */}
            <FormField
              control={form.control}
              name="is_aktif"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border/50 p-3 bg-muted/20">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Anggota Aktif
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      {field.value
                        ? "Aktif dalam kepanitiaan"
                        : "Tidak aktif dalam kepanitiaan"}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
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
