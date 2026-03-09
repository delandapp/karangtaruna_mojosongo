import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Option } from "@/components/ui/combobox-multiple";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBrandMutation } from "@/features/api/brandApi";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

// Schema validasi
const formSchema = z.object({
  nama_brand: z.string().min(2, "Nama brand harus minimal 2 karakter"),
  m_bidang_brand_id: z.string().optional(),
  m_kategori_brand_id: z.string().optional(),
  perusahaan_induk: z.string().optional(),
  whatsapp_brand: z.string().optional(),
  email_brand: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  instagram_brand: z.string().optional(),
  linkend_brand: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  bidangOptions: Option[];
  kategoriOptions: Option[];
}

export function BrandFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  bidangOptions,
  kategoriOptions,
}: BrandFormModalProps) {
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  // Assume updateBrand exists if initialData is provided
  // const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();

  const isEditing = !!initialData;
  const isLoading = isCreating; // || isUpdating

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_brand: "",
      m_bidang_brand_id: undefined,
      m_kategori_brand_id: undefined,
      perusahaan_induk: "",
      whatsapp_brand: "",
      email_brand: "",
      instagram_brand: "",
      linkend_brand: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama_brand: initialData.nama_brand || "",
          m_bidang_brand_id: initialData.m_bidang_brand_id?.toString() || undefined,
          m_kategori_brand_id: initialData.m_kategori_brand_id?.toString() || undefined,
          perusahaan_induk: initialData.perusahaan_induk || "",
          whatsapp_brand: initialData.whatsapp_brand || "",
          email_brand: initialData.email_brand || "",
          instagram_brand: initialData.instagram_brand || "",
          linkend_brand: initialData.linkend_brand || "",
        });
      } else {
        form.reset();
      }
    }
  }, [isOpen, initialData, isEditing, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        m_bidang_brand_id: data.m_bidang_brand_id ? Number(data.m_bidang_brand_id) : null,
        m_kategori_brand_id: data.m_kategori_brand_id ? Number(data.m_kategori_brand_id) : null,
      };

      if (isEditing) {
        // await updateBrand({ id: initialData.id, data: payload }).unwrap();
        // toast.success("Brand berhasil diperbarui");
        toast.error("Fitur Update sedang dalam pengembangan"); // Placeholder
      } else {
        await createBrand(payload).unwrap();
        toast.success("Brand berhasil ditambahkan");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error?.data?.message || "Terjadi kesalahan");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Tambah"} Brand Sponsorship</DialogTitle>
          <DialogDescription>
            Lengkapi detail form di bawah ini lalu klik simpan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nama_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Brand <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="TechInasia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="perusahaan_induk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perusahaan Induk</FormLabel>
                    <FormControl>
                      <Input placeholder="PT ABCD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="m_bidang_brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bidang</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Bidang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bidangOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="m_kategori_brand_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kategoriOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="0812xxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="hi@brand.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="instagram_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@techinasia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkend_brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="Link URL Profil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
