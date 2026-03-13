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
import { Button } from "@/components/ui/button";
import { useCreateSkalaPerusahaanMutation, useUpdateSkalaPerusahaanMutation } from "@/features/api/skalaPerusahaanApi";
import { createSkalaPerusahaanSchema } from "@/lib/validations/perusahaan.schema";

type SkalaPerusahaanFormValues = z.infer<typeof createSkalaPerusahaanSchema>;

interface SkalaPerusahaanModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function SkalaPerusahaanModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: SkalaPerusahaanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Skala Perusahaan" : "Tambah Skala Perusahaan";
  const desc = isEditing
    ? "Perbarui nama skala perusahaan."
    : "Isi formulir untuk menambahkan skala perusahaan baru.";

  const form = useForm<SkalaPerusahaanFormValues>({
    resolver: zodResolver(createSkalaPerusahaanSchema),
    defaultValues: {
      nama: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama: initialData.nama || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createSkala] = useCreateSkalaPerusahaanMutation();
  const [updateSkala] = useUpdateSkalaPerusahaanMutation();

  const onSubmit = async (data: SkalaPerusahaanFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateSkala({ id: initialData.id, ...data }).unwrap();
      } else {
        await createSkala(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data skala perusahaan ${data.nama} telah disimpan.`,
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
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Skala Perusahaan</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Mikro, Kecil..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
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
