"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { kelurahanSchema } from "@/lib/validations/wilayah.schema";
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

import { useCreateKelurahanMutation, useUpdateKelurahanMutation } from "@/features/api/kelurahanApi";
import { useGetProvinsiQuery } from "@/features/api/provinsiApi";
import { useGetKotaQuery } from "@/features/api/kotaApi";
import { useGetKecamatanQuery } from "@/features/api/kecamatanApi";

const formSchema = kelurahanSchema.extend({
  m_provinsi_id: z.coerce.number().optional(),
  m_kota_id: z.coerce.number().optional(),
});

type KelurahanFormValues = z.infer<typeof formSchema>;

interface KelurahanFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function KelurahanFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: KelurahanFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const [openProvinsiDropdown, setOpenProvinsiDropdown] = useState(false);
  const [openKotaDropdown, setOpenKotaDropdown] = useState(false);
  const [openKecamatanDropdown, setOpenKecamatanDropdown] = useState(false);

  const title = isEditing ? "Edit Data Kelurahan" : "Tambah Kelurahan Baru";
  const desc = isEditing
    ? "Perbarui detail master data kelurahan / desa."
    : "Tambahkan kelurahan atau desa baru di tingkat kecamatan.";

  const form = useForm<KelurahanFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      kode_wilayah: "",
      nama: "",
      m_kecamatan_id: 0,
      m_kota_id: 0,
      m_provinsi_id: 0,
    },
  });

  const selectedProvinsiId = form.watch("m_provinsi_id");
  const selectedKotaId = form.watch("m_kota_id");

  const { data: provResponse, isLoading: isLoadingProv } = useGetProvinsiQuery(
    { filter: { dropdown: true } },
    { skip: !isOpen }
  );
  
  const { data: kotaResponse, isLoading: isLoadingKota } = useGetKotaQuery(
    { filter: { dropdown: true }, m_provinsi_id: selectedProvinsiId },
    { skip: !isOpen || !selectedProvinsiId }
  );

  const { data: kecResponse, isLoading: isLoadingKec } = useGetKecamatanQuery(
    { filter: { dropdown: true }, m_kota_id: selectedKotaId },
    { skip: !isOpen || !selectedKotaId }
  );

  const provinsiList = provResponse?.data || [];
  const kotaList = kotaResponse?.data || [];
  const kecamatanList = kecResponse?.data || [];

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          kode_wilayah: initialData.kode_wilayah || "",
          nama: initialData.nama || "",
          m_kecamatan_id: initialData.m_kecamatan_id || undefined,
          m_kota_id: initialData.m_kecamatan?.m_kota_id || undefined,
          m_provinsi_id: initialData.m_kecamatan?.m_kota?.m_provinsi_id || undefined,
        });
      } else {
        form.reset({ 
          kode_wilayah: "", 
          nama: "", 
          m_kecamatan_id: undefined as any, 
          m_kota_id: undefined as any, 
          m_provinsi_id: undefined as any 
        });
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const [createKelurahan] = useCreateKelurahanMutation();
  const [updateKelurahan] = useUpdateKelurahanMutation();

  const onSubmit = async (data: KelurahanFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateKelurahan({ id: initialData.id, data }).unwrap();
      } else {
        await createKelurahan(data).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data kelurahan ${data.nama} telah disimpan.`,
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
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="m_provinsi_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col flex-1">
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
                              : isLoadingProv ? "Memuat..." : "Pilih Provinsi..."}
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
                                    form.setValue("m_kota_id", undefined as any); // Reset kota
                                    form.setValue("m_kecamatan_id", undefined as any); // Reset kecamatan
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

              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="m_kota_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel>Kota / Kab</FormLabel>
                      <Popover open={openKotaDropdown} onOpenChange={setOpenKotaDropdown}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-muted/50 focus-visible:ring-primary/50",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!selectedProvinsiId || isLoadingKota}
                            >
                              {field.value
                                ? kotaList.find((kota: any) => kota.id === field.value)?.nama
                                : isLoadingKota ? "Memuat..." : "Pilih Kota..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0 popover-content-width-same-as-trigger">
                          <Command>
                            <CommandInput placeholder="Cari kota..." />
                            <CommandList>
                              <CommandEmpty>Kota tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {kotaList.map((kota: any) => (
                                  <CommandItem
                                    key={kota.id}
                                    value={kota.nama}
                                    onSelect={() => {
                                      form.setValue("m_kota_id", kota.id);
                                      form.setValue("m_kecamatan_id", undefined as any); // Reset kecamatan
                                      setOpenKotaDropdown(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        kota.id === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {kota.nama}
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
                  name="m_kecamatan_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel>Kecamatan</FormLabel>
                      <Popover open={openKecamatanDropdown} onOpenChange={setOpenKecamatanDropdown}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-muted/50 focus-visible:ring-primary/50",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!selectedKotaId || isLoadingKec}
                            >
                              {field.value
                                ? kecamatanList.find((kec: any) => kec.id === field.value)?.nama
                                : isLoadingKec ? "Memuat..." : "Pilih Kecamatan..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0 popover-content-width-same-as-trigger">
                          <Command>
                            <CommandInput placeholder="Cari kecamatan..." />
                            <CommandList>
                              <CommandEmpty>Kecamatan tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {kecamatanList.map((kec: any) => (
                                  <CommandItem
                                    key={kec.id}
                                    value={kec.nama}
                                    onSelect={() => {
                                      form.setValue("m_kecamatan_id", kec.id);
                                      setOpenKecamatanDropdown(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        kec.id === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {kec.nama}
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
              </div>
            </div>

            <FormField
              control={form.control}
              name="kode_wilayah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Wilayah</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 33.72.01.1001"
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
                  <FormLabel>Nama Kelurahan / Desa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Jebres"
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
                {isEditing ? "Simpan Perubahan" : "Simpan Kelurahan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
