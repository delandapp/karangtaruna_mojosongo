"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateSektorIndustriMutation, useUpdateSektorIndustriMutation } from "@/features/api/sektorIndustriApi";
import { createSektorIndustriSchema } from "@/lib/validations/perusahaan.schema";

type SektorIndustriFormValues = z.infer<typeof createSektorIndustriSchema>;

interface SektorIndustriModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function SektorIndustriModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: SektorIndustriModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Sektor Industri" : "Tambah Sektor Industri";
  const desc = isEditing
    ? "Perbarui informasi Sektor Industri."
    : "Isi formulir untuk menambahkan Sektor Industri baru.";

  const form = useForm<SektorIndustriFormValues>({
    resolver: zodResolver(createSektorIndustriSchema),
    defaultValues: {
      nama_sektor: "",
      deskripsi_sektor: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama_sektor: initialData.nama_sektor || "",
          deskripsi_sektor: initialData.deskripsi_sektor || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createSektor] = useCreateSektorIndustriMutation();
  const [updateSektor] = useUpdateSektorIndustriMutation();

  const onSubmit = async (data: SektorIndustriFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateSektor({ id: initialData.id, ...data }).unwrap();
      } else {
        await createSektor(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data Sektor Industri ${data.nama_sektor} telah disimpan.`,
        },
      );
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan data", {
        description: error?.data?.error?.message || "Gagal memproses data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {desc}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pb-2"
          >
            <FormField
              control={form.control}
              name="nama_sektor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Sektor Industri</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Makanan & Minuman..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deskripsi_sektor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi singkat mengenai sektor industri ini..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50 resize-none h-20"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-transparent border-border/50 mt-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-lg mt-4 shadow-primary/20 transition-all hover:shadow-primary/30"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {isEditing ? "Simpan Perubahan" : "Simpan Data"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
