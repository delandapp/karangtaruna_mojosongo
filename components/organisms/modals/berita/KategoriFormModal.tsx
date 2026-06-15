"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Layers } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateKategoriBeritaMutation } from "@/features/api/beritaApi";

const slugRegex = /^[a-z0-9-]+$/;

const schema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(100),
  slug: z.string().max(120).regex(slugRegex, "Hanya huruf kecil, angka, tanda hubung"),
  deskripsi: z.string().optional().or(z.literal("")),
  warna_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format: #RRGGBB")
    .optional()
    .or(z.literal("")),
  urutan: z.coerce.number().int().min(0).default(0),
});

type FormValues = z.infer<typeof schema>;

function toSlug(str: string) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

interface KategoriFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  "#00BC6A", "#F57C00", "#0071F5", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981",
  "#ec4899", "#6366f1",
];

export function KategoriFormModal({ isOpen, onOpenChange, onSuccess }: KategoriFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createKategori] = useCreateKategoriBeritaMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { nama: "", slug: "", deskripsi: "", warna_hex: "#00BC6A", urutan: 0 },
  });

  const nama = form.watch("nama");
  useEffect(() => {
    if (nama) form.setValue("slug", toSlug(nama), { shouldValidate: false });
  }, [nama, form]);

  useEffect(() => {
    if (isOpen) form.reset({ nama: "", slug: "", deskripsi: "", warna_hex: "#00BC6A", urutan: 0 });
  }, [isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createKategori({
        nama: values.nama,
        slug: values.slug,
        deskripsi: values.deskripsi || undefined,
        warna_hex: values.warna_hex || undefined,
        urutan: values.urutan,
      }).unwrap();
      toast.success("Kategori berhasil ditambahkan", {
        description: `Kategori "${values.nama}" telah disimpan.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan kategori", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const warnaHex = form.watch("warna_hex");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Tambah Kategori Baru</DialogTitle>
              <DialogDescription className="text-xs">Buat kategori untuk mengelompokkan berita.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Kategori <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Kegiatan Organisasi" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="kegiatan-organisasi" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 font-mono text-sm" {...field} />
                </FormControl>
                <FormDescription className="text-xs">URL-friendly, huruf kecil dan tanda hubung</FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="deskripsi" render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Deskripsi singkat kategori..." className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 resize-none text-sm" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              {/* Warna */}
              <FormField control={form.control} name="warna_hex" render={({ field }) => (
                <FormItem>
                  <FormLabel>Warna Badge</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c} type="button"
                          onClick={() => field.onChange(c)}
                          className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                          style={{
                            backgroundColor: c,
                            borderColor: field.value === c ? "#fff" : "transparent",
                            boxShadow: field.value === c ? `0 0 0 2px ${c}` : "none",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg border border-border/60" style={{ backgroundColor: warnaHex || "#ccc" }} />
                      <FormControl>
                        <Input {...field} placeholder="#00BC6A" className="bg-muted/50 border-border/60 font-mono text-sm focus-visible:ring-primary/50" />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />

              {/* Urutan */}
              <FormField control={form.control} name="urutan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Urutan Tampil</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="0" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Angka kecil tampil duluan</FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-transparent border-border/60">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Kategori
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
