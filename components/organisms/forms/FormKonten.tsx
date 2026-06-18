"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Film, Image as ImageIcon, Send, Clock, Eye, Trash } from "lucide-react";
import { useUploadFileMutation } from "@/features/api/storageApi";
import { S3_BUCKETS } from "@/lib/constants";
import {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  useBuatKontenMutation,
  useUpdateKontenMutation,
} from "@/features/api/sosialMediaApi";
import { ComboBox } from "@/components/ui/combobox";
import { MultipleComboBox } from "@/components/ui/combobox-multiple";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { schemaBuatKonten, FormBuatKonten } from "@/lib/validations/sosial-media.schema";
import { FormJadwalKonten } from "./FormJadwalKonten";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaHeart,
  FaComment,
  FaShare,
  FaBookmark,
  FaRegHeart,
  FaRegComment,
  FaRegPaperPlane,
  FaRegBookmark,
} from "react-icons/fa";

interface FormKontenProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FormKonten({ initialData, onSuccess, onCancel }: FormKontenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduled, setIsScheduled] = useState(!!initialData?.dijadwalkan_pada);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<string>("");

  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const [buatKonten] = useBuatKontenMutation();
  const [updateKonten] = useUpdateKontenMutation();

  // Load platforms and connected accounts
  const { data: platformResponse } = useGetDaftarPlatformQuery();
  const { data: accountsResponse } = useGetAkunByPlatformQuery();

  const platforms = platformResponse?.data || [];
  const accounts = accountsResponse?.data || [];

  const form = useForm<FormBuatKonten>({
    resolver: zodResolver(schemaBuatKonten) as any,
    defaultValues: {
      akun_id: initialData?.akun_id || undefined,
      tipe_konten: initialData?.tipe_konten || "post",
      caption: initialData?.caption || "",
      platform_ids: initialData?.platform?.map((p: any) => p.platform_id) || [],
      jadwal: initialData?.dijadwalkan_pada
        ? new Date(initialData.dijadwalkan_pada).toISOString().slice(0, 16)
        : "",
      media_urls: initialData?.media?.map((m: any) => m.url) || [],
    },
  });

  const watchAkunId = form.watch("akun_id");
  const watchTipeKonten = form.watch("tipe_konten");
  const watchCaption = form.watch("caption");
  const watchPlatformIds = form.watch("platform_ids") || [];

  const selectedAccount = accounts.find((a) => a.id === watchAkunId);

  // Set active preview tab based on selected platforms
  useEffect(() => {
    if (watchPlatformIds.length > 0) {
      const activePlatform = platforms.find((p) => watchPlatformIds.includes(p.id));
      if (activePlatform) {
        setActivePreviewTab(activePlatform.slug);
      }
    } else {
      setActivePreviewTab("");
    }
  }, [watchPlatformIds, platforms]);

  // Populate media urls on initialData load
  useEffect(() => {
    if (initialData?.media) {
      setUploadedMedia(initialData.media.map((m: any) => m.url));
    }
  }, [initialData]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadFile({ bucketName: S3_BUCKETS.BERITA, file }).unwrap();
        const rawUrl =
          result?.data?.file?.urlPublik ||
          result?.data?.urlPublik ||
          result?.data?.file?.url ||
          result?.data?.url ||
          result?.data?.s3_url ||
          "";

        const url = rawUrl.startsWith("/")
          ? `${(process.env.NEXT_PUBLIC_S3_API_URL || "").replace(/\/api\/v1\/?$/, "")}${rawUrl}`
          : rawUrl;

        if (url) {
          const updated = [...uploadedMedia, url];
          setUploadedMedia(updated);
          form.setValue("media_urls", updated);
          toast.success(`Berhasil mengunggah ${file.name}`);
        }
      } catch (err) {
        toast.error(`Gagal mengunggah ${file.name}`);
      }
    }
  };

  const removeMedia = (index: number) => {
    const updated = uploadedMedia.filter((_, idx) => idx !== index);
    setUploadedMedia(updated);
    form.setValue("media_urls", updated);
  };

  const onSubmit = async (values: FormBuatKonten) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        media_urls: uploadedMedia,
        jadwal: isScheduled && values.jadwal ? new Date(values.jadwal).toISOString() : undefined,
      };

      if (initialData) {
        await updateKonten({ id: initialData.id, ...payload }).unwrap();
        toast.success("✅ Konten berhasil diperbarui");
      } else {
        await buatKonten(payload).unwrap();
        toast.success("✅ Konten berhasil dibuat");
      }
      onSuccess();
    } catch (err: any) {
      toast.error("Gagal menyimpan konten", {
        description: err?.data?.error?.message || err?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map accounts to ComboBoxItems
  const accountOptions = accounts.map((acc) => ({
    id: acc.id,
    nama: `${acc.nama_akun} (@${acc.username}) - ${acc.platform?.nama}`,
  }));

  const currentSelectedAccount = accountOptions.find((a) => a.id === watchAkunId);

  // Map platforms to Option format for MultipleComboBox
  const platformOptions = platforms.map((plat) => ({
    label: plat.nama,
    value: String(plat.id),
  }));

  const getPlatformOptionValues = () => {
    return watchPlatformIds.map(String);
  };

  // --- MOCK PREVIEW RENDERING ---
  const renderPreview = () => {
    const username = selectedAccount?.username || "username";
    const displayName = selectedAccount?.nama_akun || "Nama Akun";
    const mediaUrl = uploadedMedia[0];

    const isVideo = (url: string) => {
      if (!url) return false;
      const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
      return ["mp4", "mov", "avi", "webm"].includes(ext);
    };

    switch (activePreviewTab.toLowerCase()) {
      case "instagram":
        return (
          <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm max-w-sm mx-auto text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {username.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-none">{username}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Surakarta, Indonesia</span>
                </div>
              </div>
              <span className="font-bold text-xs tracking-wider">•••</span>
            </div>

            {/* Media Area */}
            <div className="aspect-square bg-muted/40 flex items-center justify-center overflow-hidden border-y border-border/30">
              {mediaUrl ? (
                isVideo(mediaUrl) ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls={false} muted loop autoPlay />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Instagram preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4">
                  <ImageIcon className="size-10 mb-2" />
                  <span className="text-xs">Unggah media untuk melihat preview</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaRegHeart className="size-5 cursor-pointer hover:text-red-500 transition-colors" />
                  <FaRegComment className="size-5" />
                  <FaRegPaperPlane className="size-4.5" />
                </div>
                <FaRegBookmark className="size-5" />
              </div>
              <div className="text-xs leading-relaxed space-y-1">
                <p className="font-bold">1,234 likes</p>
                <p>
                  <span className="font-bold mr-1.5">{username}</span>
                  {watchCaption || "Tulis caption konten Anda di kolom input..."}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">1 menit yang lalu</p>
              </div>
            </div>
          </div>
        );

      case "facebook":
        return (
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm max-w-sm mx-auto text-foreground space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground leading-none">{displayName}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">Baru saja</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <FaFacebook className="size-3 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Caption */}
            <p className="text-xs leading-relaxed whitespace-pre-wrap">
              {watchCaption || "Tulis caption konten Anda di kolom input..."}
            </p>

            {/* Media Area */}
            {mediaUrl && (
              <div className="aspect-video bg-muted/40 rounded-xl overflow-hidden border border-border/30">
                {isVideo(mediaUrl) ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" controls={false} muted loop autoPlay />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Facebook preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Engagement count */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
              <span>👍 Love, Like, dan 45 lainnya</span>
              <span>12 Komentar • 3 Share</span>
            </div>

            <Separator className="opacity-40" />

            {/* Action Buttons */}
            <div className="grid grid-cols-3 text-center text-[11px] text-muted-foreground font-semibold">
              <span className="py-1 hover:bg-muted/50 rounded-lg cursor-pointer">👍 Like</span>
              <span className="py-1 hover:bg-muted/50 rounded-lg cursor-pointer">💬 Komen</span>
              <span className="py-1 hover:bg-muted/50 rounded-lg cursor-pointer">🔄 Bagikan</span>
            </div>
          </div>
        );

      case "twitter":
        return (
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm max-w-sm mx-auto text-foreground space-y-3">
            {/* Thread Header */}
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-zinc-950 flex items-center justify-center text-xs text-white font-bold shrink-0">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold truncate leading-none">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground">@{username}</span>
                  <span className="text-[10px] text-muted-foreground">• 1d</span>
                </div>

                {/* Tweet Body */}
                <p className="text-xs leading-relaxed mt-1 whitespace-pre-wrap">
                  {watchCaption || "Tulis caption tweet Anda di kolom input..."}
                </p>

                {/* Media area */}
                {mediaUrl && (
                  <div className="aspect-video bg-muted/40 rounded-xl overflow-hidden border border-border/30 mt-2">
                    {isVideo(mediaUrl) ? (
                      <video src={mediaUrl} className="w-full h-full object-cover" controls={false} muted loop autoPlay />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl} alt="Twitter preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                {/* Tweet actions */}
                <div className="flex items-center justify-between max-w-xs text-muted-foreground text-[10px] mt-3 pt-1">
                  <span>💬 45</span>
                  <span>🔁 12</span>
                  <span>❤️ 89</span>
                  <span>📊 1.2K</span>
                  <span>📤 Share</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "tiktok":
        return (
          <div className="bg-zinc-950 text-white rounded-2xl overflow-hidden shadow-sm max-w-sm mx-auto aspect-[9/16] relative flex flex-col justify-end p-4">
            {/* Background Video or Image */}
            {mediaUrl ? (
              isVideo(mediaUrl) ? (
                <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" controls={false} muted loop autoPlay />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl} alt="TikTok preview" className="absolute inset-0 w-full h-full object-cover" />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
                <Film className="size-12 mb-2" />
                <span className="text-xs">Unggah video untuk preview TikTok</span>
              </div>
            )}

            {/* Dark Overlay for bottom text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Sidebar Action Buttons */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
              <div className="flex flex-col items-center">
                <div className="size-9 rounded-full bg-zinc-800 border border-white flex items-center justify-center font-bold text-xs text-white">
                  {username.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <FaHeart className="size-6 text-white drop-shadow-md" />
                <span className="text-[10px] font-semibold drop-shadow-md">12.5K</span>
              </div>
              <div className="flex flex-col items-center">
                <FaComment className="size-6 text-white drop-shadow-md" />
                <span className="text-[10px] font-semibold drop-shadow-md">340</span>
              </div>
              <div className="flex flex-col items-center">
                <FaBookmark className="size-6 text-white drop-shadow-md" />
                <span className="text-[10px] font-semibold drop-shadow-md">1.2K</span>
              </div>
              <div className="flex flex-col items-center">
                <FaShare className="size-6 text-white drop-shadow-md" />
                <span className="text-[10px] font-semibold drop-shadow-md">280</span>
              </div>
            </div>

            {/* Caption Details */}
            <div className="z-10 space-y-2 max-w-[80%]">
              <p className="font-bold text-sm">@{username}</p>
              <p className="text-xs leading-relaxed text-zinc-200 line-clamp-3">
                {watchCaption || "Tulis caption konten Anda di kolom input..."}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <span className="animate-pulse">🎵</span>
                <span className="truncate">Suara Asli - @{username}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed rounded-xl">
            Pilih platform tujuan untuk melihat preview postingan.
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Section */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* ── Akun Sosial Media Sumber ── */}
              <FormField
                control={form.control}
                name="akun_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pilih Akun Sumber <span className="text-destructive">*</span></FormLabel>
                    <ComboBox
                      title="Akun Sosial Media"
                      data={accountOptions}
                      selected={currentSelectedAccount}
                      onChange={(val: any) => {
                        field.onChange(val ? val.id : undefined);
                      }}
                      valueKey="id"
                      labelKey="nama"
                    />
                    <FormDescription className="text-[10px]">
                      Pilih profil akun sosial media terhubung yang ingin Anda jadikan pengirim postingan.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* ── Tipe Konten ── */}
              <FormField
                control={form.control}
                name="tipe_konten"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Postingan <span className="text-destructive">*</span></FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: "post", label: "Post" },
                        { value: "story", label: "Story" },
                        { value: "reels", label: "Reels" },
                        { value: "tweet", label: "Tweet" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-xl border transition-all
                            ${field.value === opt.value
                              ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                              : "bg-muted/40 hover:bg-muted border-border/60 text-muted-foreground"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* ── Platform Tujuan Publish ── */}
              <FormField
                control={form.control}
                name="platform_ids"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Pilih Platform Tujuan <span className="text-destructive">*</span></FormLabel>
                    <MultipleComboBox
                      placeholder="Pilih platform publish..."
                      options={platformOptions}
                      selected={getPlatformOptionValues()}
                      onChange={(vals) => {
                        field.onChange(vals.map(Number));
                      }}
                    />
                    <FormDescription className="text-[10px]">
                      Satu postingan dapat dipublikasikan ke banyak platform sosial media sekaligus.
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* ── Caption Konten ── */}
              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Isi Caption Konten <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Tulis apa yang Anda pikirkan atau isi detail konten Anda di sini..."
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50 resize-none rounded-xl"
                      />
                    </FormControl>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                      <span>Maksimal 2200 karakter</span>
                      <span>{watchCaption?.length || 0}/2200</span>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* ── Upload Media Area ── */}
              <div className="space-y-2">
                <FormLabel>Unggah File Media <span className="text-[11px] text-muted-foreground font-normal">(Gambar / Video)</span></FormLabel>

                {/* Uploaded media previews */}
                {uploadedMedia.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {uploadedMedia.map((url, idx) => {
                      const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
                      const isVideo = ["mp4", "mov", "avi", "webm"].includes(ext);

                      return (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted/40">
                          {isVideo ? (
                            <video src={url} className="w-full h-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeMedia(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 cursor-pointer shadow flex items-center justify-center"
                          >
                            <Trash className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File input drop zone */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all p-5 text-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <ImageIcon className="size-8 text-muted-foreground mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    {isUploading ? "Mengunggah..." : "Klik atau seret file ke sini untuk mengunggah media"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Mendukung file gambar (JPG, PNG) & video (MP4)</p>
                </div>
              </div>

              {/* ── Jadwalkan Posting Toggle ── */}
              <Separator className="opacity-40" />

              <div className="flex items-center justify-between rounded-xl bg-muted/30 border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" />
                    Jadwalkan Posting Konten
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    Aktifkan jika ingin memposting konten pada waktu tertentu, atau matikan untuk disimpan sebagai draft.
                  </p>
                </div>
                <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
              </div>

              {isScheduled && (
                <div className="p-4 bg-muted/20 border border-border/50 rounded-xl space-y-4">
                  <FormJadwalKonten form={form} name="jadwal" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="bg-transparent border-border/50 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold rounded-xl"
                >
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {initialData ? "Simpan Perubahan" : isScheduled ? "Jadwalkan Postingan" : "Simpan sebagai Draft"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>

      {/* Preview Section */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="size-4 text-primary" />
          Preview Postingan Sosial Media
        </h3>

        {/* Selected Preview Tabs */}
        {watchPlatformIds.length > 0 ? (
          <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            {platforms
              .filter((p) => watchPlatformIds.includes(p.id))
              .map((plat) => (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setActivePreviewTab(plat.slug)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-semibold rounded-lg capitalize transition-all
                    ${activePreviewTab === plat.slug
                      ? "bg-card text-foreground shadow-xs border border-border/30"
                      : "text-muted-foreground hover:text-foreground"}`}
                >
                  {plat.nama}
                </button>
              ))}
          </div>
        ) : (
          <div className="p-4 border rounded-xl text-center text-muted-foreground text-xs bg-muted/10">
            Pilih minimal satu platform tujuan di formulir untuk memunculkan panel preview.
          </div>
        )}

        {/* Render Preview Component */}
        {watchPlatformIds.length > 0 && activePreviewTab && (
          <div className="p-6 border border-border/40 bg-muted/10 rounded-2xl flex items-center justify-center min-h-[300px]">
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
  );
}
