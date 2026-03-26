"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { provinsiSchema } from "@/lib/validations/wilayah.schema";
import * as z from "zod";

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
import { useCreateProvinsiMutation, useUpdateProvinsiMutation } from "@/features/api/provinsiApi";

type ProvinsiFormValues = z.infer<typeof provinsiSchema>;

interface ProvinsiFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function ProvinsiFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: ProvinsiFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Data Provinsi" : "Tambah Provinsi Baru";
  const desc = isEditing
    ? "Perbarui detail master data provinsi."
    : "Tambahkan provinsi baru ke dalam sistem master data wilayah.";

  const form = useForm<ProvinsiFormValues>({
    resolver: zodResolver(provinsiSchema),
    defaultValues: {
      kode_wilayah: "",
      nama: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          kode_wilayah: initialData.kode_wilayah || "",
          nama: initialData.nama || "",
        });
      } else {
        form.reset({ kode_wilayah: "", nama: "" });
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createProvinsi] = useCreateProvinsiMutation();
  const [updateProvinsi] = useUpdateProvinsiMutation();

  const onSubmit = async (data: ProvinsiFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProvinsi({ id: initialData.id, data }).unwrap();
      } else {
        await createProvinsi(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data provinsi ${data.nama} telah disimpan.`,
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
              name="kode_wilayah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Wilayah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 33"
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
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Provinsi</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Jawa Tengah"
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
                className="bg-transparent border-border/50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {isEditing ? "Simpan Perubahan" : "Simpan Provinsi"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
