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

const levelFormSchema = z.object({
  nama_level: z
    .string()
    .min(3, "Nama level minimal 3 karakter")
    .max(50, "Nama level maksimal 50 karakter"),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

interface LevelFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function LevelFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: LevelFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Data Level" : "Tambah Level Baru";
  const desc = isEditing
    ? "Perbarui nama level hak akses."
    : "Isi formulir untuk menambahkan level hak akses ke dalam master data.";

  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelFormSchema),
    defaultValues: {
      nama_level: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama_level: initialData.nama_level || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const onSubmit = async (data: LevelFormValues) => {
    setIsSubmitting(true);
    try {
      const endpoint = isEditing
        ? `/api/levels/${initialData.id}`
        : "/api/levels";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error("Gagal menyimpan data", {
          description: json.error?.message,
        });
        return;
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data level ${data.nama_level} telah disimpan.`,
        },
      );
      onSuccess();
    } catch (error) {
      toast.error("Kesalahan jaringan", {
        description: "Gagal memproses data",
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
              name="nama_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Level</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Admin, Pengurus..."
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
                {isEditing ? "Simpan Perubahan" : "Simpan Level"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
