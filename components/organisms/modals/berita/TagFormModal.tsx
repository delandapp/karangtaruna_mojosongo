"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Tag } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateTagBeritaMutation } from "@/features/api/beritaApi";

const slugRegex = /^[a-z0-9-]+$/;
const schema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(80),
  slug: z.string().max(100).regex(slugRegex, "Hanya huruf kecil, angka, tanda hubung"),
  deskripsi: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function toSlug(str: string) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

interface TagFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TagFormModal({ isOpen, onOpenChange, onSuccess }: TagFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createTag] = useCreateTagBeritaMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { nama: "", slug: "", deskripsi: "" },
  });

  const nama = form.watch("nama");
  useEffect(() => {
    if (nama) form.setValue("slug", toSlug(nama), { shouldValidate: false });
  }, [nama, form]);

  useEffect(() => {
    if (isOpen) form.reset({ nama: "", slug: "", deskripsi: "" });
  }, [isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await createTag({
        nama: values.nama,
        slug: values.slug,
        deskripsi: values.deskripsi || undefined,
      }).unwrap();
      toast.success("Tag berhasil ditambahkan", {
        description: `Tag "#${values.nama}" telah disimpan.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan tag", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Tambah Tag Baru</DialogTitle>
              <DialogDescription className="text-xs">Tag digunakan untuk mengelompokkan topik berita.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nama" render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Tag <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Kepemudaan" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="kepemudaan" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 font-mono text-sm" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  Akan menjadi: <span className="text-primary">#{field.value || "..."}</span>
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <FormField control={form.control} name="deskripsi" render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Deskripsi singkat tag..." className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 resize-none text-sm" {...field} />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="bg-transparent border-border/60">
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Tag
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
