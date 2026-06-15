"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, X, Upload, ImageIcon, Eye, EyeOff,
  Newspaper, Image as ImageLucide, Search,
  Tag, Hash, Star, Zap, Calendar,
} from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { TipTapEditor } from "@/components/organisms/editors/TipTapEditor";
import {
  useCreateBeritaMutation,
  useUpdateBeritaMutation,
  useGetKategoriBeritaQuery,
  useGetTagBeritaQuery,
  type Berita,
  type KategoriBerita,
  type TagBerita,
} from "@/features/api/beritaApi";
import { useUploadFileMutation } from "@/features/api/storageApi";

// ─── Schema ───────────────────────────────────────────────────────────────────

const slugRegex = /^[a-z0-9-]+$/;

const formSchema = z.object({
  judul: z.string().min(5, "Judul minimal 5 karakter").max(300),
  sub_judul: z.string().max(500).optional().or(z.literal("")),
  penulis: z.string().min(2, "Penulis minimal 2 karakter").max(150),
  editor: z.string().max(150).optional().or(z.literal("")),
  m_kategori_berita_id: z.coerce.number().int().positive("Kategori wajib dipilih"),
  is_featured: z.boolean().default(false),
  is_breaking_news: z.boolean().default(false),
  seo_slug: z.string().max(300).regex(slugRegex, "Hanya huruf kecil, angka, dan tanda hubung (-)"),
  seo_title: z.string().max(70).optional().or(z.literal("")),
  seo_description: z.string().max(160).optional().or(z.literal("")),
  seo_og_image_url: z.string().url("URL tidak valid").optional().or(z.literal("")),
  seo_keywords: z.string().optional(),
  seo_robots: z.string().max(100).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface BeritaFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Berita | null;
}

// ─── Slug Generator ───────────────────────────────────────────────────────────

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u").replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Tag Multi-Select ─────────────────────────────────────────────────────────

function TagSelector({
  tags,
  selectedIds,
  onChange,
}: {
  tags: TagBerita[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = selectedIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all",
              selected
                ? "bg-primary/15 border-primary text-primary"
                : "bg-muted/50 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            )}
          >
            <Hash className="h-3 w-3" />
            {tag.nama}
          </button>
        );
      })}
      {tags.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Belum ada tag tersedia.</p>
      )}
    </div>
  );
}

// ─── Cover Upload ─────────────────────────────────────────────────────────────

const S3_BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET_BERITA || "karangtaruna-berita";

function CoverUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploadFile, { isLoading }] = useUploadFileMutation();
  const [preview, setPreview] = useState(value || "");

  useEffect(() => { setPreview(value || ""); }, [value]);

  const handleFile = useCallback(async (file: File) => {
    try {
      const result = await uploadFile({ bucketName: S3_BUCKET, file }).unwrap();
      const url: string = result?.data?.url || result?.data?.s3_url || result?.data?.Location || "";
      if (url) {
        onChange(url);
        setPreview(url);
        toast.success("Cover berhasil diupload");
      } else {
        toast.error("Upload berhasil tapi URL tidak ditemukan");
      }
    } catch {
      toast.error("Gagal upload cover", { description: "Periksa koneksi atau konfigurasi S3" });
    }
  }, [uploadFile, onChange]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all",
          "border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-primary/5",
          preview ? "border-primary/40" : ""
        )}
      >
        {preview ? (
          <div className="relative h-full w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Cover preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <label className="cursor-pointer rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all">
                <Upload className="mr-2 inline h-4 w-4" /> Ganti Cover
                <input type="file" accept="image/*" className="sr-only" disabled={isLoading}
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 cursor-pointer p-8 text-center">
            {isLoading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Mengupload cover...</p>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <ImageLucide className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Klik atau drag & drop cover</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP maks 10MB — rasio 16:9 direkomendasikan</p>
                </div>
                <div className="mt-1 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
                  Pilih File
                </div>
              </>
            )}
            <input type="file" accept="image/*" className="sr-only" disabled={isLoading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        )}
      </div>

      {/* URL manual input */}
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">atau tempel URL</span>
        <Separator className="flex-1" />
      </div>
      <Input
        placeholder="https://..."
        value={preview}
        onChange={(e) => { setPreview(e.target.value); onChange(e.target.value); }}
        className="bg-muted/50 text-xs focus-visible:ring-primary/50"
      />
      {preview && (
        <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-destructive hover:text-destructive"
          onClick={() => { setPreview(""); onChange(""); }}>
          <X className="mr-1.5 h-3.5 w-3.5" /> Hapus Cover
        </Button>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function BeritaFormModal({ isOpen, onOpenChange, onSuccess, initialData }: BeritaFormModalProps) {
  const isEditing = !!initialData;

  // Editor state
  const [editorContent, setEditorContent] = useState<{
    html: string; plaintext: string; json: Record<string, unknown>;
    wordCount: number; charCount: number;
  }>({ html: "", plaintext: "", json: {}, wordCount: 0, charCount: 0 });
  const [coverUrl, setCoverUrl] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("konten");

  // API hooks
  const [createBerita] = useCreateBeritaMutation();
  const [updateBerita] = useUpdateBeritaMutation();
  const { data: kategoriResponse } = useGetKategoriBeritaQuery({ dropdown: true });
  const { data: tagResponse } = useGetTagBeritaQuery({ dropdown: true });

  const kategoris: KategoriBerita[] = (kategoriResponse?.data as KategoriBerita[]) || [];
  const tags: TagBerita[] = (tagResponse?.data as TagBerita[]) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      judul: "", sub_judul: "", penulis: "", editor: "",
      m_kategori_berita_id: 0, is_featured: false, is_breaking_news: false,
      seo_slug: "", seo_title: "", seo_description: "",
      seo_og_image_url: "", seo_keywords: "", seo_robots: "index,follow",
    },
  });

  // Populate form on open/edit
  useEffect(() => {
    if (!isOpen) return;

    if (isEditing && initialData) {
      form.reset({
        judul: initialData.judul || "",
        sub_judul: initialData.sub_judul || "",
        penulis: initialData.penulis || "",
        editor: initialData.editor || "",
        m_kategori_berita_id: initialData.m_kategori_berita_id || 0,
        is_featured: initialData.is_featured || false,
        is_breaking_news: initialData.is_breaking_news || false,
        seo_slug: initialData.seo_slug || "",
        seo_title: initialData.seo_title || "",
        seo_description: initialData.seo_description || "",
        seo_og_image_url: initialData.seo_og_image_url || "",
        seo_keywords: initialData.seo_keywords?.join(", ") || "",
        seo_robots: initialData.seo_robots || "index,follow",
      });
      setEditorContent({
        html: initialData.konten_html || "",
        plaintext: initialData.konten_plaintext || "",
        json: (initialData.konten_json as Record<string, unknown>) || {},
        wordCount: 0,
        charCount: 0,
      });
      const cover = initialData.c_berita_cover?.find((c) => c.is_primary);
      setCoverUrl(cover?.s3_url || "");
      setSelectedTagIds(initialData.r_berita_tag?.map((rt) => rt.m_tag.id) || []);
    } else {
      form.reset();
      setEditorContent({ html: "", plaintext: "", json: {}, wordCount: 0, charCount: 0 });
      setCoverUrl("");
      setSelectedTagIds([]);
      setActiveTab("konten");
    }
  }, [isOpen, isEditing, initialData, form]);

  // Auto-generate slug from judul
  const judul = form.watch("judul");
  useEffect(() => {
    if (!isEditing && judul) {
      form.setValue("seo_slug", toSlug(judul), { shouldValidate: false });
    }
  }, [judul, isEditing, form]);

  // Sync OG image with cover
  useEffect(() => {
    if (coverUrl) form.setValue("seo_og_image_url", coverUrl);
  }, [coverUrl, form]);

  const handleSubmit = async (values: FormValues, publishNow = false) => {
    if (!editorContent.html || editorContent.html === "<p></p>") {
      toast.error("Konten berita tidak boleh kosong");
      setActiveTab("konten");
      return;
    }

    setIsSubmitting(true);
    try {
      const keywords = values.seo_keywords
        ? values.seo_keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : [];

      const payload = {
        judul: values.judul,
        sub_judul: values.sub_judul || undefined,
        penulis: values.penulis,
        editor: values.editor || undefined,
        konten_json: editorContent.json,
        konten_html: editorContent.html,
        konten_plaintext: editorContent.plaintext,
        m_kategori_berita_id: values.m_kategori_berita_id,
        tag_ids: selectedTagIds,
        is_featured: values.is_featured,
        is_breaking_news: values.is_breaking_news,
        seo_slug: values.seo_slug,
        seo_title: values.seo_title || undefined,
        seo_description: values.seo_description || undefined,
        seo_og_image_url: values.seo_og_image_url || coverUrl || undefined,
        seo_keywords: keywords,
        seo_robots: values.seo_robots || undefined,
      };

      if (isEditing && initialData) {
        await updateBerita({ id: initialData.id, ...payload }).unwrap();
      } else {
        await createBerita(payload).unwrap();
      }

      toast.success(isEditing ? "Berita berhasil diperbarui" : "Berita berhasil dibuat", {
        description: publishNow ? "Berita disimpan sebagai draft. Anda dapat mempublikasikannya dari tabel." : `"${values.judul}" telah disimpan.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan berita", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const seoSlug = form.watch("seo_slug");
  const seoDesc = form.watch("seo_description");
  const seoTitle = form.watch("seo_title");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-full max-w-5xl overflow-hidden flex flex-col border-border/50 bg-card/98 backdrop-blur-xl rounded-2xl p-0">

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Newspaper className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {isEditing ? "Edit Berita" : "Tulis Berita Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isEditing ? "Perbarui konten, cover, dan SEO berita." : "Buat artikel berita baru untuk portal publik."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => handleSubmit(v))} className="flex flex-col flex-1 overflow-hidden">

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 pt-4 pb-0 shrink-0">
                <TabsList className="h-9 gap-1 bg-muted/50 p-1 w-full">
                  <TabsTrigger value="konten" className="flex-1 gap-1.5 text-xs data-[state=active]:shadow-sm">
                    <Newspaper className="h-3.5 w-3.5" />
                    Konten
                    {editorContent.charCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                        {editorContent.wordCount}w
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="cover" className="flex-1 gap-1.5 text-xs data-[state=active]:shadow-sm">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Cover
                    {coverUrl && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary inline-block" />}
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex-1 gap-1.5 text-xs data-[state=active]:shadow-sm">
                    <Search className="h-3.5 w-3.5" />
                    SEO
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── Tab: Konten ── */}
              <TabsContent value="konten" className="flex-1 overflow-y-auto mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <div className="space-y-5 px-6 py-4">

                  {/* Judul + Sub-judul */}
                  <div className="space-y-3">
                    <FormField control={form.control} name="judul" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Judul Berita <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan judul berita yang menarik..."
                            className="bg-muted/40 text-base font-medium focus-visible:ring-primary/50 border-border/60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sub_judul" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-muted-foreground">Sub-judul / Ringkasan</FormLabel>
                        <FormControl>
                          <Input placeholder="Ringkasan singkat berita..." className="bg-muted/40 focus-visible:ring-primary/50 border-border/60" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  {/* Penulis + Editor + Kategori */}
                  <div className="grid grid-cols-3 gap-3">
                    <FormField control={form.control} name="penulis" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Penulis <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Nama penulis..." className="bg-muted/40 focus-visible:ring-primary/50 border-border/60 text-sm" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="editor" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Editor</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama editor..." className="bg-muted/40 focus-visible:ring-primary/50 border-border/60 text-sm" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="m_kategori_berita_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium">Kategori <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/40 border-border/60 focus:ring-primary/50 text-sm">
                              <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                            {kategoris.map((k) => (
                              <SelectItem key={k.id} value={String(k.id)}>
                                <div className="flex items-center gap-2">
                                  {k.warna_hex && (
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: k.warna_hex }} />
                                  )}
                                  {k.nama}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      <FormLabel className="text-xs font-medium text-muted-foreground">Tag Berita</FormLabel>
                    </div>
                    <TagSelector tags={tags} selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
                  </div>

                  {/* Toggles: Featured + Breaking */}
                  <div className="flex flex-wrap items-center gap-4">
                    <FormField control={form.control} name="is_featured" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                          <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                          <FormLabel className="text-sm font-medium cursor-pointer">Berita Unggulan</FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">Tampil di hero utama</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="ml-auto data-[state=checked]:bg-amber-500" />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="is_breaking_news" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 space-y-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                          <Zap className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <FormLabel className="text-sm font-medium cursor-pointer">Breaking News</FormLabel>
                          <FormDescription className="text-xs text-muted-foreground">Tampil di ticker atas</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="ml-auto data-[state=checked]:bg-destructive" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <Separator className="border-border/50" />

                  {/* TipTap Editor */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Konten Berita <span className="text-destructive">*</span>
                    </FormLabel>
                    <TipTapEditor
                      content={editorContent.html || editorContent.json}
                      onChange={setEditorContent}
                      placeholder="Mulai menulis konten berita di sini..."
                      minHeight={380}
                      maxHeight={600}
                    />
                    {!editorContent.html && (
                      <p className="text-xs text-destructive">Konten berita wajib diisi</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab: Cover ── */}
              <TabsContent value="cover" className="flex-1 overflow-y-auto mt-0">
                <div className="space-y-5 px-6 py-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Cover / Thumbnail</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Gambar cover yang akan tampil di halaman listing dan detail berita. Disarankan rasio 16:9 (1920×1080px).
                    </p>
                  </div>
                  <CoverUpload value={coverUrl} onChange={setCoverUrl} />

                  {/* Cover preview as card */}
                  {coverUrl && (
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <div className="bg-muted/30 px-3 py-2 flex items-center gap-2 border-b border-border/40">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Preview Card</span>
                      </div>
                      <div className="p-3">
                        <div className="overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverUrl} alt="Preview" className="h-40 w-full object-cover" />
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="h-3 w-16 rounded bg-primary/30" />
                          <div className="h-4 w-full rounded bg-muted" />
                          <div className="h-3 w-3/4 rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Tab: SEO ── */}
              <TabsContent value="seo" className="flex-1 overflow-y-auto mt-0">
                <div className="space-y-5 px-6 py-4">
                  {/* SEO Preview */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">Preview Google SERP</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">karangtarunamojosongo.id › berita › {seoSlug || "slug-berita"}</p>
                      <p className="text-base font-medium text-blue-600 dark:text-blue-400 line-clamp-1">
                        {seoTitle || judul || "Judul Berita"}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {seoDesc || "Deskripsi SEO akan tampil di sini. Tulis deskripsi menarik untuk meningkatkan CTR di mesin pencari."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* SEO Slug */}
                    <FormField control={form.control} name="seo_slug" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" />
                          URL Slug <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="judul-berita-contoh" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 font-mono text-sm" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          /berita/<span className="text-primary">{field.value || "..."}</span>
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />

                    {/* SEO Title */}
                    <FormField control={form.control} name="seo_title" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Judul SEO
                          <span className={cn("ml-2 text-xs", (field.value?.length || 0) > 70 ? "text-destructive" : "text-muted-foreground")}>
                            {field.value?.length || 0}/70
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Judul SEO (maks 70 karakter)" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  {/* SEO Description */}
                  <FormField control={form.control} name="seo_description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Deskripsi SEO
                        <span className={cn("ml-2 text-xs", (field.value?.length || 0) > 160 ? "text-destructive" : "text-muted-foreground")}>
                          {field.value?.length || 0}/160
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Deskripsi menarik yang tampil di hasil pencarian Google..."
                          className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 resize-none text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Keywords */}
                    <FormField control={form.control} name="seo_keywords" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="karang taruna, mojosongo, pemuda" className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 text-sm" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">Pisahkan dengan koma</FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />

                    {/* Robots */}
                    <FormField control={form.control} name="seo_robots" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Robots</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/50 border-border/60 focus:ring-primary/50">
                              <SelectValue placeholder="Pilih robot tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                            <SelectItem value="index,follow">index, follow (default)</SelectItem>
                            <SelectItem value="noindex,follow">noindex, follow</SelectItem>
                            <SelectItem value="index,nofollow">index, nofollow</SelectItem>
                            <SelectItem value="noindex,nofollow">noindex, nofollow</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                  </div>

                  {/* OG Image URL */}
                  <FormField control={form.control} name="seo_og_image_url" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">OG Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." className="bg-muted/50 focus-visible:ring-primary/50 border-border/60 font-mono text-xs" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">Akan otomatis diisi dari cover. Ukuran ideal: 1200×630px</FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )} />
                </div>
              </TabsContent>
            </Tabs>

            {/* ── Footer ── */}
            <div className="shrink-0 border-t border-border/50 bg-muted/20 px-6 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {editorContent.wordCount > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Calendar className="h-3 w-3" />
                    {editorContent.wordCount} kata · {editorContent.charCount} karakter
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="bg-transparent border-border/60"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isEditing ? "Simpan Perubahan" : "Simpan Draft"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
