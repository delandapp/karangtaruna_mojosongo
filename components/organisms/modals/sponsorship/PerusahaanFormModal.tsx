"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  FaInstagram,
  FaLinkedin,
  FaWhatsapp,
} from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";

import {
  useCreatePerusahaanMutation,
  useUpdatePerusahaanMutation,
  Perusahaan,
} from "@/features/api/perusahaanApi";

import { ComboBox } from "@/components/ui/combobox";
import {
  useGetProvinsiQuery,
  useGetKotaQuery,
  useGetKecamatanQuery,
  useGetKelurahanQuery,
} from "@/features/api/wilayahApi";

import { useGetSektorIndustriListQuery } from "@/features/api/sektorIndustriApi";
import { useGetSkalaPerusahaanListQuery } from "@/features/api/skalaPerusahaanApi";
import { createPerusahaanSchema } from "@/lib/validations/perusahaan.schema";

type FormValues = z.infer<typeof createPerusahaanSchema>;

interface PerusahaanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Perusahaan | null;
}

export function PerusahaanFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: PerusahaanFormModalProps) {
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<"informasi" | "alamat" | "sosmed" | "klasifikasi">(
    "informasi",
  );

  const [createPerusahaan, { isLoading: isCreating }] = useCreatePerusahaanMutation();
  const [updatePerusahaan, { isLoading: isUpdating }] = useUpdatePerusahaanMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(createPerusahaanSchema),
    defaultValues: {
      nama: "",
      nama_kontak: "",
      jabatan_kontak: "",
      no_handphone: "",
      email: "",
      website: "",
      instagram: "",
      linkedin: "",
      whatsapp: "",
      alamat: "",
      sumber_informasi: "",
      catatan: "",
      logo_url: "",
      m_sektor_industri_id: null,
      m_skala_perusahaan_id: null,
      kode_wilayah_induk_provinsi: "",
      kode_wilayah_induk_kota: "",
      kode_wilayah_induk_kecamatan: "",
      kode_wilayah_induk_kelurahan: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const extractUsername = (
          url: string | undefined | null,
          pattern: RegExp | string,
        ) => {
          if (!url) return "";
          try {
            if (typeof pattern === "string") {
              return url.split(pattern)[1]?.replace(/\/$/, "") || url;
            }
            const match = url.match(pattern);
            return match ? match[1] : url;
          } catch (e) {
            return url;
          }
        };

        form.reset({
          nama: initialData.nama,
          nama_kontak: initialData.nama_kontak || "",
          jabatan_kontak: initialData.jabatan_kontak || "",
          no_handphone: initialData.no_handphone || "",
          email: initialData.email || "",
          website: initialData.website || "",
          alamat: initialData.alamat || "",
          logo_url: initialData.logo_url || "",
          sumber_informasi: initialData.sumber_informasi || "",
          catatan: initialData.catatan || "",
          m_sektor_industri_id: initialData.m_sektor_industri_id || null,
          m_skala_perusahaan_id: initialData.m_skala_perusahaan_id || null,
          kode_wilayah_induk_provinsi: initialData.kode_wilayah_induk_provinsi || "",
          kode_wilayah_induk_kota: initialData.kode_wilayah_induk_kota || "",
          kode_wilayah_induk_kecamatan: initialData.kode_wilayah_induk_kecamatan || "",
          kode_wilayah_induk_kelurahan: initialData.kode_wilayah_induk_kelurahan || "",
          instagram: extractUsername(initialData.instagram, "instagram.com/"),
          linkedin: initialData.linkedin || "",
          whatsapp: initialData.whatsapp
            ? initialData.whatsapp.replace("https://wa.me/62", "0").replace(/^\+62/, "0")
            : "",
        });
      } else {
        form.reset();
      }
      setActiveTab("informasi");
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const processedWhatsapp = values.whatsapp
            ? `+62${values.whatsapp.replace(/^0/, "")}`
            : null;

      const payload = {
        ...values,
        no_handphone: values.no_handphone || null,
        email: values.email || null,
        website: values.website || null,
        alamat: values.alamat || null,
        logo_url: values.logo_url || null,
        sumber_informasi: values.sumber_informasi || null,
        catatan: values.catatan || null,
        nama_kontak: values.nama_kontak || null,
        jabatan_kontak: values.jabatan_kontak || null,
        instagram: values.instagram
          ? `https://instagram.com/${values.instagram.replace(/^@/, "")}`
          : null,
        whatsapp: processedWhatsapp,
        linkedin: values.linkedin || null,
        m_sektor_industri_id: values.m_sektor_industri_id ? Number(values.m_sektor_industri_id) : null,
        m_skala_perusahaan_id: values.m_skala_perusahaan_id ? Number(values.m_skala_perusahaan_id) : null,
        kode_wilayah_induk_provinsi: values.kode_wilayah_induk_provinsi || null,
        kode_wilayah_induk_kota: values.kode_wilayah_induk_kota || null,
        kode_wilayah_induk_kecamatan: values.kode_wilayah_induk_kecamatan || null,
        kode_wilayah_induk_kelurahan: values.kode_wilayah_induk_kelurahan || null,
      };

      if (isEditing && initialData) {
        await updatePerusahaan({ id: initialData.id, ...payload }).unwrap();
        toast.success("Berhasil!", {
          description: "Data perusahaan berhasil diperbarui.",
        });
      } else {
        await createPerusahaan(payload).unwrap();
        toast.success("Berhasil!", {
          description: "Perusahaan baru berhasil ditambahkan.",
        });
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error("Gagal menyimpan data", {
        description:
          error?.data?.error?.message || "Terjadi kesalahan pada server.",
      });
    }
  };

  const isLoading = isCreating || isUpdating;

  // Watch region values for cascading
  const selectedProvinsi = form.watch("kode_wilayah_induk_provinsi");
  const selectedKota = form.watch("kode_wilayah_induk_kota");
  const selectedKecamatan = form.watch("kode_wilayah_induk_kecamatan");

  // Fetch Wilayah Data
  const { data: provinsiRes, isFetching: loadingProv } = useGetProvinsiQuery();
  const { data: kotaRes, isFetching: loadingKota } = useGetKotaQuery(selectedProvinsi as string, { skip: !selectedProvinsi });
  const { data: kecamatanRes, isFetching: loadingKec } = useGetKecamatanQuery(selectedKota as string, { skip: !selectedKota });
  const { data: kelurahanRes, isFetching: loadingKel } = useGetKelurahanQuery(selectedKecamatan as string, { skip: !selectedKecamatan });

  const provinsiData = provinsiRes?.data?.map(i => ({ id: i.kode_wilayah, nama: i.nama })) || [];
  const kotaData = kotaRes?.data?.map(i => ({ id: i.kode_wilayah, nama: i.nama })) || [];
  const kecamatanData = kecamatanRes?.data?.map(i => ({ id: i.kode_wilayah, nama: i.nama })) || [];
  const kelurahanData = kelurahanRes?.data?.map(i => ({ id: i.kode_wilayah, nama: i.nama })) || [];

  // Fetch Sektor & Skala Data
  const { data: sektorRes, isFetching: loadingSektor } = useGetSektorIndustriListQuery({ dropdown: true });
  const { data: skalaRes, isFetching: loadingSkala } = useGetSkalaPerusahaanListQuery({ dropdown: true });

  const sektorData = sektorRes?.data?.map((i: any) => ({ id: i.id.toString(), nama: i.nama_sektor })) || [];
  const skalaData = skalaRes?.data?.map((i: any) => ({ id: i.id.toString(), nama: i.nama })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Data Perusahaan" : "Tambah Perusahaan Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui detail perusahaan."
              : "Masukkan detail informasi perusahaan."}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/50 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("informasi")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "informasi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Info Utama & Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("klasifikasi")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "klasifikasi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Klasifikasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("alamat")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "alamat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Lokasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sosmed")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "sosmed"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Sosmed & Link
          </button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 pt-4 space-y-6"
          >
            <div
              className={`space-y-4 ${activeTab === "informasi" ? "block" : "hidden"}`}
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Perusahaan <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: PT. Maju Bersama"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="nama_kontak"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Person In Charge (PIC)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama PIC..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="jabatan_kontak"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jabatan PIC</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: HR / Manager" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@contoh.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="no_handphone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. Telepon / HP</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 08123456789" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Logo Perusahaan</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://contoh.com/logo.png"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={`space-y-4 ${activeTab === "klasifikasi" ? "block" : "hidden"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="m_sektor_industri_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sektor Industri</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={sektorData}
                          selected={field.value?.toString() || ""}
                          onChange={(val) => {
                            field.onChange(typeof val === "string" ? val : val.id.toString());
                          }}
                          title="Sektor"
                          disabled={loadingSektor || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="m_skala_perusahaan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skala Perusahaan</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={skalaData}
                          selected={field.value?.toString() || ""}
                          onChange={(val) => {
                            field.onChange(typeof val === "string" ? val : val.id.toString());
                          }}
                          title="Skala"
                          disabled={loadingSkala || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="sumber_informasi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sumber Informasi / Relasi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Didapatkan dari mana?"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Tambahan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Misal: Perusahaan multinasional..."
                        className="resize-none h-24"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={`space-y-4 ${activeTab === "alamat" ? "block" : "hidden"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kode_wilayah_induk_provinsi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provinsi</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={provinsiData}
                          selected={field.value || ""}
                          onChange={(val) => {
                            const newProv = typeof val === "string" ? val : val.id.toString();
                            field.onChange(newProv);
                            form.setValue("kode_wilayah_induk_kota", "");
                            form.setValue("kode_wilayah_induk_kecamatan", "");
                            form.setValue("kode_wilayah_induk_kelurahan", "");
                          }}
                          title="Provinsi"
                          disabled={loadingProv || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kode_wilayah_induk_kota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kota / Kabupaten</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={kotaData}
                          selected={field.value || ""}
                          onChange={(val) => {
                            const newKota = typeof val === "string" ? val : val.id.toString();
                            field.onChange(newKota);
                            form.setValue("kode_wilayah_induk_kecamatan", "");
                            form.setValue("kode_wilayah_induk_kelurahan", "");
                          }}
                          title="Kota / Kabupaten"
                          disabled={!selectedProvinsi || loadingKota || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kode_wilayah_induk_kecamatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kecamatan</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={kecamatanData}
                          selected={field.value || ""}
                          onChange={(val) => {
                            const newKec = typeof val === "string" ? val : val.id.toString();
                            field.onChange(newKec);
                            form.setValue("kode_wilayah_induk_kelurahan", "");
                          }}
                          title="Kecamatan"
                          disabled={!selectedKota || loadingKec || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kode_wilayah_induk_kelurahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kelurahan / Desa</FormLabel>
                      <FormControl>
                        <ComboBox
                          data={kelurahanData}
                          selected={field.value || ""}
                          onChange={(val) => {
                            const newKel = typeof val === "string" ? val : val.id.toString();
                            field.onChange(newKel);
                          }}
                          title="Kelurahan"
                          disabled={!selectedKecamatan || loadingKel || isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="alamat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat Lengkap</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jl. Raya Utama No.123, Kodepos..."
                        className="resize-none h-24"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div
              className={`space-y-4 ${activeTab === "sosmed" ? "block" : "hidden"}`}
            >
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Website Resmi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://perusahaan.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Username</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaInstagram />
                        </div>

                        <Input
                          placeholder="@username"
                          className="pl-10"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaLinkedin />
                        </div>
                        <Input
                          placeholder="https://linkedin.com/company/nama..."
                          className="pl-10"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaWhatsapp />
                        </div>
                        <span className="absolute left-10 text-muted-foreground text-sm">
                          +62
                        </span>
                        <Input
                          placeholder="81234567890"
                          className="pl-[72px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Data"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
