"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaYoutube,
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
  useCreateOrganisasiMutation,
  useUpdateOrganisasiMutation,
  Organisasi,
} from "@/features/api/organisasiApi";

const mediaSosialSchema = z.object({
  instagram: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  youtube: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
});

const formSchema = z.object({
  nama_org: z.string().min(3, "Nama organisasi minimal 3 karakter"),
  kelurahan: z.string().min(3, "Kelurahan wajib diisi"),
  kecamatan: z.string().min(3, "Kecamatan wajib diisi"),
  kota: z.string().min(3, "Kota wajib diisi"),
  provinsi: z.string().min(3, "Provinsi wajib diisi"),
  no_handphone: z.string().max(20).optional().or(z.literal("")),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  alamat: z.string().optional().or(z.literal("")),
  logo_url: z
    .string()
    .url("Format URL tidak valid")
    .optional()
    .or(z.literal("")),
  visi: z.string().optional().or(z.literal("")),
  misi: z.string().optional().or(z.literal("")),
  media_sosial: mediaSosialSchema.optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface OrganisasiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Organisasi | null;
}

export function OrganisasiFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: OrganisasiFormModalProps) {
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<"informasi" | "alamat" | "sosmed">(
    "informasi",
  );

  const [createOrganisasi, { isLoading: isCreating }] =
    useCreateOrganisasiMutation();
  const [updateOrganisasi, { isLoading: isUpdating }] =
    useUpdateOrganisasiMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_org: "",
      kelurahan: "",
      kecamatan: "",
      kota: "",
      provinsi: "",
      no_handphone: "",
      email: "",
      alamat: "",
      logo_url: "",
      visi: "",
      misi: "",
      media_sosial: {
        instagram: "",
        facebook: "",
        tiktok: "",
        youtube: "",
        whatsapp: "",
      },
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Extract usernames/phone from full URLs to display in form
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

        const sosmed = initialData.media_sosial;

        form.reset({
          nama_org: initialData.nama_org,
          kelurahan: initialData.kelurahan,
          kecamatan: initialData.kecamatan,
          kota: initialData.kota,
          provinsi: initialData.provinsi,
          no_handphone: initialData.no_handphone || "",
          email: initialData.email || "",
          alamat: initialData.alamat || "",
          logo_url: initialData.logo_url || "",
          visi: initialData.visi || "",
          misi: initialData.misi || "",
          media_sosial: {
            instagram: extractUsername(sosmed?.instagram, "instagram.com/"),
            facebook: extractUsername(sosmed?.facebook, "facebook.com/"),
            tiktok: extractUsername(sosmed?.tiktok, /tiktok\.com\/@([^/]+)/),
            youtube:
              extractUsername(sosmed?.youtube, /youtube\.com\/@([^/]+)/) ||
              extractUsername(sosmed?.youtube, "youtube.com/c/"),
            whatsapp: sosmed?.whatsapp
              ? sosmed.whatsapp.replace("https://wa.me/62", "0")
              : "",
          },
        });
      } else {
        form.reset({
          nama_org: "",
          kelurahan: "",
          kecamatan: "",
          kota: "",
          provinsi: "",
          no_handphone: "",
          email: "",
          alamat: "",
          logo_url: "",
          visi: "",
          misi: "",
          media_sosial: {
            instagram: "",
            facebook: "",
            tiktok: "",
            youtube: "",
            whatsapp: "",
          },
        });
      }
      setActiveTab("informasi");
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const processedMediaSosial = values.media_sosial
        ? {
          instagram: values.media_sosial.instagram
            ? `https://instagram.com/${values.media_sosial.instagram.replace(/^@/, "")}`
            : null,
          facebook: values.media_sosial.facebook
            ? `https://facebook.com/${values.media_sosial.facebook}`
            : null,
          tiktok: values.media_sosial.tiktok
            ? `https://tiktok.com/@${values.media_sosial.tiktok.replace(/^@/, "")}`
            : null,
          youtube: values.media_sosial.youtube
            ? `https://youtube.com/@${values.media_sosial.youtube.replace(/^@/, "")}`
            : null,
          whatsapp: values.media_sosial.whatsapp
            ? `https://wa.me/62${values.media_sosial.whatsapp.replace(/^0/, "")}`
            : null,
        }
        : null;

      const payload = {
        ...values,
        no_handphone: values.no_handphone || null,
        email: values.email || null,
        alamat: values.alamat || null,
        logo_url: values.logo_url || null,
        visi: values.visi || null,
        misi: values.misi || null,
        media_sosial: processedMediaSosial,
      };

      if (isEditing && initialData) {
        await updateOrganisasi({ id: initialData.id, ...payload }).unwrap();
        toast.success("Berhasil!", {
          description: "Data organisasi berhasil diperbarui.",
        });
      } else {
        await createOrganisasi(payload).unwrap();
        toast.success("Berhasil!", {
          description: "Organisasi baru berhasil ditambahkan.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Data Organisasi" : "Tambah Organisasi Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui informasi organisasi menggunakan form di bawah ini."
              : "Masukkan detail informasi organisasi baru."}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-border/50 px-6">
          <button
            type="button"
            onClick={() => setActiveTab("informasi")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "informasi"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Informasi Umum
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("alamat")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "alamat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Area & Alamat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sosmed")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "sosmed"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            Sosial Media
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
                name="nama_org"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Organisasi{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Karang Taruna Mojosongo"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Organisasi</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@contoh.com"
                          {...field}
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
                      <FormLabel>Nomor Handphone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 08123456789" {...field} />
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
                    <FormLabel>URL Logo / Avatar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://contoh.com/logo.png"
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
                  name="visi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Visi organisasi..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="misi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Misi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Misi organisasi (pisahkan dengan baris) ..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div
              className={`space-y-4 ${activeTab === "alamat" ? "block" : "hidden"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="provinsi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Provinsi <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Jawa Tengah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kota / Kabupaten{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Surakarta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kecamatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kecamatan <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Jebres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kelurahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kelurahan / Desa{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Mojosongo" {...field} />
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
                name="media_sosial.instagram"
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
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="media_sosial.facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook Username</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaFacebook />
                        </div>
                        <Input
                          placeholder="@username"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="media_sosial.whatsapp"
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
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="media_sosial.tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok Username</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaTiktok />
                        </div>
                        <Input
                          placeholder="@username"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="media_sosial.youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Handle</FormLabel>
                    <FormControl>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 flex items-center justify-center text-muted-foreground w-5 h-5">
                          <FaYoutube />
                        </div>
                        <Input
                          placeholder="channel_name"
                          className="pl-10"
                          {...field}
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
