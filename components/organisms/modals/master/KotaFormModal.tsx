"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { kotaSchema } from "@/lib/validations/wilayah.schema";
import * as z from "zod";
import { cn } from "@/lib/utils";

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useCreateKotaMutation, useUpdateKotaMutation } from "@/features/api/kotaApi";
import { useGetProvinsiQuery } from "@/features/api/provinsiApi";

type KotaFormValues = z.infer<typeof kotaSchema>;

interface KotaFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function KotaFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: KotaFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;
  const [openProvinsiDropdown, setOpenProvinsiDropdown] = useState(false);

  const title = isEditing ? "Edit Data Kota" : "Tambah Kota Baru";
  const desc = isEditing
    ? "Perbarui detail master data kota."
    : "Tambahkan kota/kabupaten baru di bawah provinsi ke sistem.";

  const form = useForm<KotaFormValues>({
    resolver: zodResolver(kotaSchema) as any,
    defaultValues: {
      kode_wilayah: "",
      nama: "",
      m_provinsi_id: 0,
    },
  });

  const { data: provResponse, isLoading: isLoadingProv } = useGetProvinsiQuery(
    { filter: { dropdown: true } },
    { skip: !isOpen }
  );
  
  const provinsiList = provResponse?.data || [];

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          kode_wilayah: initialData.kode_wilayah || "",
          nama: initialData.nama || "",
          m_provinsi_id: initialData.m_provinsi_id || undefined,
        });
      } else {
        form.reset({ kode_wilayah: "", nama: "", m_provinsi_id: undefined as any });
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createKota] = useCreateKotaMutation();
  const [updateKota] = useUpdateKotaMutation();

  const onSubmit = async (data: KotaFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateKota({ id: initialData.id, data }).unwrap();
      } else {
        await createKota(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data kota ${data.nama} telah disimpan.`,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
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
              name="m_provinsi_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Provinsi</FormLabel>
                  <Popover open={openProvinsiDropdown} onOpenChange={setOpenProvinsiDropdown}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between bg-muted/50 focus-visible:ring-primary/50",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isLoadingProv}
                        >
                          {field.value
                            ? provinsiList.find((prov: any) => prov.id === field.value)?.nama
                            : isLoadingProv ? "HooMemuat Data..." : "Pilih Provinsi..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 popover-content-width-same-as-trigger">
                      <Command>
                        <CommandInput placeholder="Cari provinsi..." />
                        <CommandList>
                          <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {provinsiList.map((prov: any) => (
                              <CommandItem
                                key={prov.id}
                                value={prov.nama}
                                onSelect={() => {
                                  form.setValue("m_provinsi_id", prov.id);
                                  setOpenProvinsiDropdown(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    prov.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {prov.nama}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kode_wilayah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Wilayah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 33.72"
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
                  <FormLabel>Nama Kota / Kab</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Kota Surakarta"
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
                {isEditing ? "Simpan Perubahan" : "Simpan Kota"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
