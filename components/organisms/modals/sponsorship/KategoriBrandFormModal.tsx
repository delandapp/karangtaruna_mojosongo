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
import {
  useCreateKategoriBrandMutation,
  useUpdateKategoriBrandMutation,
} from "@/features/api/kategoriBrandApi";

const kategoriBrandFormSchema = z.object({
  nama_kategori: z.string().min(3, "Minimal 3 karakter").max(100),
  deskripsi_kategori: z.string().optional(),
});

type KategoriBrandFormValues = z.infer<typeof kategoriBrandFormSchema>;

interface KategoriBrandFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function KategoriBrandFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: KategoriBrandFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Data Kategori Brand" : "Tambah Kategori Brand Baru";
  const desc = isEditing
    ? "Perbarui informasi kategori brand."
    : "Isi formulir untuk menambahkan kategori brand ke dalam master data sponsorship.";

  const form = useForm<KategoriBrandFormValues>({
    resolver: zodResolver(kategoriBrandFormSchema),
    defaultValues: {
      nama_kategori: "",
      deskripsi_kategori: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama_kategori: initialData.nama_kategori || "",
          deskripsi_kategori: initialData.deskripsi_kategori || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createKategoriBrand] = useCreateKategoriBrandMutation();
  const [updateKategoriBrand] = useUpdateKategoriBrandMutation();

  const onSubmit = async (data: KategoriBrandFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateKategoriBrand({ id: initialData.id, data }).unwrap();
      } else {
        await createKategoriBrand(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data kategori brand ${data.nama_kategori} telah disimpan.`,
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
              name="nama_kategori"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori Brand</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sponsor Utama, Co-Sponsor..."
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
              name="deskripsi_kategori"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Deskripsi kategori brand..."
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
                {isEditing ? "Simpan Perubahan" : "Simpan Kategori Brand"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
