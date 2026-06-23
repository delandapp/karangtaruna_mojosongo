"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save,
  Link2,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Settings,
  Eye,
  Plus,
  Trash2,
  Pencil,
  Copy,
  ExternalLink,
  ChevronLeft,
  GripVertical,
  Check,
  Globe,
  AlertTriangle,
} from "lucide-react";
import * as FaIcons from "react-icons/fa6";
import { useUploadFileMutation } from "@/features/api/storageApi";
import { S3_BUCKETS } from "@/lib/constants/key";

// Drag and drop imports
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HexColorPicker } from "react-colorful";

import { DAFTAR_TEMA, TemaLinktree } from "@/lib/tema-linktree";
import {
  useCreateLinktreeMutation,
  useUpdateLinktreeMutation,
  useCekSlugTersediaQuery,
  useTambahLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
  useUrutanUlangLinkMutation,
  Linktree,
  LinktreeLink,
} from "@/features/api/linktreeApi";

// ── Dynamic Icon Renderer ──────────────────────────────────────────────────
export function LinkIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (FaIcons as any)[name];
  if (!IconComponent) return <FaIcons.FaGlobe className={className} style={style} />;
  return <IconComponent className={className} style={style} />;
}

// Icon list options for select
const ICON_OPTIONS = [
  { value: "FaGlobe", label: "Website / Globe" },
  { value: "FaInstagram", label: "Instagram" },
  { value: "FaWhatsapp", label: "WhatsApp" },
  { value: "FaFacebook", label: "Facebook" },
  { value: "FaTiktok", label: "TikTok" },
  { value: "FaXTwitter", label: "Twitter (X)" },
  { value: "FaYoutube", label: "YouTube" },
  { value: "FaGithub", label: "GitHub" },
  { value: "FaLinkedin", label: "LinkedIn" },
  { value: "FaEnvelope", label: "Email" },
  { value: "FaPhone", label: "Telepon" },
];

interface FormLinktreeProps {
  initialData?: Linktree | null;
}

// ── Sortable Item Component ────────────────────────────────────────────────
function SortableLinkItem({
  link,
  onEdit,
  onDelete,
  onToggle,
}: {
  link: LinktreeLink;
  onEdit: (link: LinktreeLink) => void;
  onDelete: (id: number) => void;
  onToggle: (link: LinktreeLink) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-muted/40 border border-border/60 rounded-xl gap-3"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-foreground text-muted-foreground p-1 shrink-0">
        <GripVertical className="size-4" />
      </div>

      <div className="size-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
        <LinkIcon name={link.ikon || "FaGlobe"} className="size-4 text-primary" style={{ color: link.warna_ikon || undefined }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{link.judul}</p>
        <p className="text-[10px] text-muted-foreground truncate">{link.url}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Switch
          checked={link.aktif}
          onCheckedChange={() => onToggle(link)}
          size="sm"
        />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(link)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={() => onDelete(link.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function FormLinktree({ initialData }: FormLinktreeProps) {
  const router = useRouter();
  const [createLinktree, { isLoading: isCreating }] = useCreateLinktreeMutation();
  const [updateLinktree, { isLoading: isUpdating }] = useUpdateLinktreeMutation();
  const isLoading = isCreating || isUpdating;

  // Form Profile State
  const [judul, setJudul] = useState("");
  const [bio, setBio] = useState("");
  const [slug, setSlug] = useState("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [fotoProfilUrl, setFotoProfilUrl] = useState("");
  const [tema, setTema] = useState("minimal-light");
  const [aktif, setAktif] = useState(true);

  // Custom styling
  const [warnaPrimer, setWarnaPrimer] = useState("");
  const [warnaLatar, setWarnaLatar] = useState("");
  const [fontKustom, setFontKustom] = useState("");

  // Linktree V2 premium configurations
  const [bgImageUrl, setBgImageUrl] = useState("");
  const [gayaTombol, setGayaTombol] = useState("");
  const [animasiTombol, setAnimasiTombol] = useState("");
  const [warnaTombolLatar, setWarnaTombolLatar] = useState("");
  const [warnaTombolTeks, setWarnaTombolTeks] = useState("");
  const [warnaTombolBorder, setWarnaTombolBorder] = useState("");
  const [borderRadiusTombol, setBorderRadiusTombol] = useState("");

  // Social media footer
  const [sosmedInstagram, setSosmedInstagram] = useState("");
  const [sosmedTiktok, setSosmedTiktok] = useState("");
  const [sosmedWhatsapp, setSosmedWhatsapp] = useState("");
  const [sosmedFacebook, setSosmedFacebook] = useState("");
  const [sosmedYoutube, setSosmedYoutube] = useState("");
  const [sosmedGithub, setSosmedGithub] = useState("");
  const [sosmedEmail, setSosmedEmail] = useState("");
  const [sosmedTelepon, setSosmedTelepon] = useState("");

  // SEO & Meta
  const [metaJudul, setMetaJudul] = useState("");
  const [metaDeskripsi, setMetaDeskripsi] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Link Items (Only in Edit Mode)
  const links: LinktreeLink[] = initialData?.links ?? [];

  // Modal Add/Edit Link States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<LinktreeLink | null>(null);
  const [linkJudul, setLinkJudul] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkIkon, setLinkIkon] = useState("FaGlobe");
  const [linkWarnaIkon, setLinkWarnaIkon] = useState("");
  const [linkAktif, setLinkAktif] = useState(true);
  const [linkWarnaLatar, setLinkWarnaLatar] = useState("");
  const [linkWarnaTeks, setLinkWarnaTeks] = useState("");
  const [linkWarnaBorder, setLinkWarnaBorder] = useState("");
  const [linkAnimasi, setLinkAnimasi] = useState("");

  // Mutations for links & files
  const [tambahLink] = useTambahLinkMutation();
  const [updateLink] = useUpdateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const [urutanUlangLink] = useUrutanUlangLinkMutation();
  const [uploadFile] = useUploadFileMutation();
  
  // Loading states for file uploads
  const [uploadingProfil, setUploadingProfil] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Debouncing slug for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  // Cek keunikan slug query
  const { data: slugCheckData } = useCekSlugTersediaQuery(
    { slug: debouncedSlug, excludeId: initialData?.id },
    { skip: !debouncedSlug || debouncedSlug.length < 3 }
  );

  const slugTersedia = slugCheckData?.tersedia;

  // Sync initial data to form states
  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setBio(initialData.bio || "");
      setSlug(initialData.slug);
      setFotoProfilUrl(initialData.foto_profil_url || "");
      setTema(initialData.tema);
      setAktif(initialData.aktif);
      setWarnaPrimer(initialData.warna_primer || "");
      setWarnaLatar(initialData.warna_latar || "");
      setFontKustom(initialData.font_kustom || "");
      setBgImageUrl(initialData.bg_image_url || "");
      setGayaTombol(initialData.gaya_tombol || "");
      setAnimasiTombol(initialData.animasi_tombol || "");
      setWarnaTombolLatar(initialData.warna_tombol_latar || "");
      setWarnaTombolTeks(initialData.warna_tombol_teks || "");
      setWarnaTombolBorder(initialData.warna_tombol_border || "");
      setBorderRadiusTombol(initialData.border_radius_tombol || "");
      setSosmedInstagram(initialData.sosmed_instagram || "");
      setSosmedTiktok(initialData.sosmed_tiktok || "");
      setSosmedWhatsapp(initialData.sosmed_whatsapp || "");
      setSosmedFacebook(initialData.sosmed_facebook || "");
      setSosmedYoutube(initialData.sosmed_youtube || "");
      setSosmedGithub(initialData.sosmed_github || "");
      setSosmedEmail(initialData.sosmed_email || "");
      setSosmedTelepon(initialData.sosmed_telepon || "");
      setMetaJudul(initialData.meta_judul || "");
      setMetaDeskripsi(initialData.meta_deskripsi || "");
    }
  }, [initialData]);

  // Handle Photo Profil Upload via S3
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan PNG atau JPG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    setUploadingProfil(true);
    try {
      const res = await uploadFile({
        bucketName: S3_BUCKETS.LINKTREE,
        file,
      }).unwrap();
      
      if (res.success && res.data?.fileUrl) {
        setFotoProfilUrl(res.data.fileUrl);
        toast.success("Foto profil berhasil diunggah.");
      } else {
        toast.error("Gagal mengunggah foto profil.");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Gagal mengunggah foto profil.");
    } finally {
      setUploadingProfil(false);
    }
  };

  // Handle Background Image Upload via S3
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan PNG atau JPG.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    setUploadingBg(true);
    try {
      const res = await uploadFile({
        bucketName: S3_BUCKETS.LINKTREE,
        file,
      }).unwrap();
      
      if (res.success && res.data?.fileUrl) {
        setBgImageUrl(res.data.fileUrl);
        toast.success("Gambar latar berhasil diunggah.");
      } else {
        toast.error("Gagal mengunggah gambar latar.");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Gagal mengunggah gambar latar.");
    } finally {
      setUploadingBg(false);
    }
  };

  // Submit Linktree profile changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      judul,
      bio: bio || undefined,
      slug,
      tema,
      foto_profil_url: fotoProfilUrl || undefined,
      warna_primer: warnaPrimer || undefined,
      warna_latar: warnaLatar || undefined,
      font_kustom: fontKustom || undefined,
      bg_image_url: bgImageUrl || undefined,
      gaya_tombol: gayaTombol || undefined,
      animasi_tombol: animasiTombol || undefined,
      warna_tombol_latar: warnaTombolLatar || undefined,
      warna_tombol_teks: warnaTombolTeks || undefined,
      warna_tombol_border: warnaTombolBorder || undefined,
      border_radius_tombol: borderRadiusTombol || undefined,
      sosmed_instagram: sosmedInstagram || undefined,
      sosmed_tiktok: sosmedTiktok || undefined,
      sosmed_whatsapp: sosmedWhatsapp || undefined,
      sosmed_facebook: sosmedFacebook || undefined,
      sosmed_youtube: sosmedYoutube || undefined,
      sosmed_github: sosmedGithub || undefined,
      sosmed_email: sosmedEmail || undefined,
      sosmed_telepon: sosmedTelepon || undefined,
      meta_judul: metaJudul || undefined,
      meta_deskripsi: metaDeskripsi || undefined,
      aktif,
    };

    try {
      if (initialData) {
        await updateLinktree({ id: initialData.id, ...payload }).unwrap();
        toast.success("Linktree berhasil diperbarui!");
      } else {
        const res = await createLinktree(payload).unwrap();
        toast.success("Halaman Linktree berhasil dibuat!");
        router.push(`/dashboard/linktree/${res.data.id}/edit`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Gagal menyimpan Linktree");
    }
  };

  // ── Drag and Drop Reordering Handlers ──────────────────────────────────────
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !initialData) return;

    const oldIndex = links.findIndex((item) => item.id === active.id);
    const newIndex = links.findIndex((item) => item.id === over.id);

    const reorderedLinks = arrayMove(links, oldIndex, newIndex);

    // Prepare payload
    const urutanPayload = reorderedLinks.map((item, index) => ({
      id: item.id,
      urutan: index,
    }));

    try {
      await urutanUlangLink({ linktreeId: initialData.id, links: urutanPayload }).unwrap();
    } catch {
      toast.error("Gagal memperbarui urutan link");
    }
  };

  // ── Link CRUD Operations ───────────────────────────────────────────────────
  const handleOpenLinkModal = (link?: LinktreeLink) => {
    if (link) {
      setSelectedLink(link);
      setLinkJudul(link.judul);
      setLinkUrl(link.url);
      setLinkIkon(link.ikon || "FaGlobe");
      setLinkWarnaIkon(link.warna_ikon || "");
      setLinkAktif(link.aktif);
      setLinkWarnaLatar(link.warna_latar || "");
      setLinkWarnaTeks(link.warna_teks || "");
      setLinkWarnaBorder(link.warna_border || "");
      setLinkAnimasi(link.animasi || "");
    } else {
      setSelectedLink(null);
      setLinkJudul("");
      setLinkUrl("");
      setLinkIkon("FaGlobe");
      setLinkWarnaIkon("");
      setLinkAktif(true);
      setLinkWarnaLatar("");
      setLinkWarnaTeks("");
      setLinkWarnaBorder("");
      setLinkAnimasi("");
    }
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = async () => {
    if (!linkJudul.trim() || !linkUrl.trim()) {
      toast.error("Judul dan URL wajib diisi");
      return;
    }

    const payload = {
      judul: linkJudul,
      url: linkUrl,
      ikon: linkIkon,
      warna_ikon: linkWarnaIkon || undefined,
      aktif: linkAktif,
      warna_latar: linkWarnaLatar || undefined,
      warna_teks: linkWarnaTeks || undefined,
      warna_border: linkWarnaBorder || undefined,
      animasi: linkAnimasi || undefined,
    };

    try {
      if (selectedLink && initialData) {
        await updateLink({
          linktreeId: initialData.id,
          linkId: selectedLink.id,
          ...payload,
        }).unwrap();
        toast.success("Link berhasil diperbarui");
      } else if (initialData) {
        await tambahLink({
          linktreeId: initialData.id,
          ...payload,
        }).unwrap();
        toast.success("Link berhasil ditambahkan");
      }
      setIsLinkModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Gagal menyimpan link");
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!initialData) return;
    try {
      await deleteLink({ linktreeId: initialData.id, linkId }).unwrap();
      toast.success("Link berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus link");
    }
  };

  const handleToggleLinkActive = async (link: LinktreeLink) => {
    if (!initialData) return;
    try {
      await updateLink({
        linktreeId: initialData.id,
        linkId: link.id,
        aktif: !link.aktif,
      }).unwrap();
    } catch {
      toast.error("Gagal mengubah status link");
    }
  };

  // Get current active theme config
  const currentTemaConfig = DAFTAR_TEMA.find((t) => t.kode === tema) || DAFTAR_TEMA[0];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Kolom Kiri: Form Panel (55%) */}
      <div className="w-full lg:w-[55%] flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="size-5 text-primary" /> Pengaturan Profil Linktree
              </CardTitle>
              <CardDescription>Atur biodata, foto profil, dan tema halaman Linktree Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="profil" className="w-full">
                <TabsList className="flex w-full justify-start rounded-none border-b border-border bg-transparent p-0 overflow-x-auto">
                  <TabsTrigger value="profil" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    Profil
                  </TabsTrigger>
                  <TabsTrigger value="tema" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    Latar Tema
                  </TabsTrigger>
                  <TabsTrigger value="tombol" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    Desain Tombol
                  </TabsTrigger>
                  <TabsTrigger value="sosmed" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    Media Sosial
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    SEO Meta
                  </TabsTrigger>
                </TabsList>

                {/* TABS 1: PROFIL */}
                <TabsContent value="profil" className="p-6 space-y-5 outline-none">
                  {/* Foto Profil */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Foto Profil</Label>
                    <div className="flex items-center gap-4">
                      {fotoProfilUrl ? (
                        <div className="relative size-14 rounded-full border overflow-hidden bg-muted shrink-0">
                          <img src={fotoProfilUrl} alt="Profil preview" className="object-cover size-full" />
                        </div>
                      ) : (
                        <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {judul ? judul.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handlePhotoUpload}
                          disabled={uploadingProfil}
                          className="max-w-xs cursor-pointer text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {uploadingProfil ? "Mengunggah..." : "Mendukung format PNG atau JPG. Maksimal 2MB."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Judul */}
                  <div className="space-y-2">
                    <Label htmlFor="judul" className="font-semibold">Nama / Judul Halaman <span className="text-red-500">*</span></Label>
                    <Input
                      id="judul"
                      placeholder="Contoh: Karang Taruna RW 04"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      className="bg-muted/30"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-semibold">Bio Singkat</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tulis deskripsi singkat profil Anda..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-muted/30 min-h-[80px]"
                      maxLength={300}
                    />
                    <p className="text-[10px] text-right text-muted-foreground">{bio.length}/300 karakter</p>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="font-semibold">Slug Tautan Halaman <span className="text-red-500">*</span></Label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center h-10 px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-xs font-mono select-none">
                        mojosongo.org/link/
                      </span>
                      <Input
                        id="slug"
                        placeholder="rw04-mojosongo"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        className="rounded-l-none bg-muted/30 font-mono"
                      />
                    </div>

                    {debouncedSlug && debouncedSlug.length >= 3 && (
                      <div className="text-[11px] font-medium mt-1">
                        {slugTersedia === true ? (
                          <span className="text-emerald-500">✓ Slug tersedia untuk digunakan</span>
                        ) : slugTersedia === false ? (
                          <span className="text-red-500">✗ Slug sudah digunakan, silakan pilih yang lain</span>
                        ) : (
                          <span className="text-muted-foreground">Menghubungkan...</span>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TABS 2: LATAR TEMA */}
                <TabsContent value="tema" className="p-6 space-y-6 outline-none">
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Pilih Tema Halaman</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {DAFTAR_TEMA.map((t) => {
                        const active = tema === t.kode;
                        return (
                          <div
                            key={t.kode}
                            onClick={() => setTema(t.kode)}
                            className={`p-3 rounded-xl border border-border/60 cursor-pointer transition-all hover:scale-102 flex flex-col justify-between min-h-[90px] ${
                              active ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "bg-muted/15"
                            }`}
                          >
                            <span className="text-xs font-bold text-foreground block">{t.nama}</span>
                            <span className="text-[9px] text-muted-foreground block line-clamp-2 mt-1 leading-tight">
                              {t.deskripsi}
                            </span>
                            <div className="flex gap-1.5 mt-2 select-none">
                              <span className="size-3.5 rounded-full border border-border" style={{ background: t.latar }} />
                              <span className="size-3.5 rounded-full border border-border" style={{ background: t.warna_primer }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kustomisasi override warna */}
                  <div className="pt-4 border-t border-border/40 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Kustomisasi Lanjutan (Opsional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Override Warna Primer (Teks/Aksen)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                              <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: warnaPrimer || "#CCC" }} />
                              <span>{warnaPrimer || "Gunakan bawaan tema"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit p-3 bg-card border-border/85">
                            <HexColorPicker color={warnaPrimer || "#000000"} onChange={setWarnaPrimer} />
                            <Button size="xs" variant="ghost" onClick={() => setWarnaPrimer("")} className="mt-2 w-full">Reset Bawaan</Button>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Override Warna Latar</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                              <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: warnaLatar || "#CCC" }} />
                              <span>{warnaLatar || "Gunakan bawaan tema"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit p-3 bg-card border-border/85">
                            <HexColorPicker color={warnaLatar || "#FFFFFF"} onChange={setWarnaLatar} />
                            <Button size="xs" variant="ghost" onClick={() => setWarnaLatar("")} className="mt-2 w-full">Reset Bawaan</Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Background Image Upload */}
                  <div className="pt-4 border-t border-border/40 space-y-3">
                    <Label className="font-semibold text-xs">Unggah Gambar Latar (Opsional)</Label>
                    <div className="flex items-center gap-4">
                      {bgImageUrl ? (
                        <div className="relative size-14 rounded-lg border overflow-hidden bg-muted shrink-0">
                          <img src={bgImageUrl} alt="Background preview" className="object-cover size-full" />
                          <button
                            type="button"
                            onClick={() => setBgImageUrl("")}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-lg p-0.5"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="size-14 rounded-lg bg-muted border flex items-center justify-center text-muted-foreground shrink-0">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleBgUpload}
                          disabled={uploadingBg}
                          className="max-w-xs cursor-pointer text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {uploadingBg ? "Mengunggah..." : "Gunakan gambar kustom sebagai background halaman. Maksimal 5MB."}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TABS: DESAIN TOMBOL */}
                <TabsContent value="tombol" className="p-6 space-y-6 outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gaya Tombol Dropdown */}
                    <div className="space-y-1.5">
                      <Label htmlFor="gaya_tombol" className="text-xs font-semibold">Gaya Tombol Utama</Label>
                      <Select value={gayaTombol} onValueChange={setGayaTombol}>
                        <SelectTrigger id="gaya_tombol">
                          <SelectValue placeholder="Gunakan bawaan tema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Bawaan Tema</SelectItem>
                          <SelectItem value="solid">Solid (Penuh)</SelectItem>
                          <SelectItem value="outline">Outline (Garis Tepi)</SelectItem>
                          <SelectItem value="soft">Soft (Transparan Tipis)</SelectItem>
                          <SelectItem value="ghost">Ghost (Tanpa Latar & Border)</SelectItem>
                          <SelectItem value="glass">Glass (Kaca Blur)</SelectItem>
                          <SelectItem value="brutalist">Brutalist (Shadow Hitam Tebal)</SelectItem>
                          <SelectItem value="brutalist-offset">Brutalist Offset (3D Popout)</SelectItem>
                          <SelectItem value="double-border">Double Border (Garis Ganda)</SelectItem>
                          <SelectItem value="shadow-offset">Shadow Offset (Bayangan Lembut)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Animasi Tombol Dropdown */}
                    <div className="space-y-1.5">
                      <Label htmlFor="animasi_tombol" className="text-xs font-semibold">Efek Animasi Tombol</Label>
                      <Select value={animasiTombol} onValueChange={setAnimasiTombol}>
                        <SelectTrigger id="animasi_tombol">
                          <SelectValue placeholder="Tanpa animasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Animasi</SelectItem>
                          <SelectItem value="pulse">Pulse (Denyut Perlahan)</SelectItem>
                          <SelectItem value="bounce">Bounce (Memantul)</SelectItem>
                          <SelectItem value="float">Float (Melayang Naik Turun)</SelectItem>
                          <SelectItem value="wobble">Wobble (Goyang Kanan Kiri)</SelectItem>
                          <SelectItem value="glow">Glow (Efek Neon Bercahaya)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="border_radius_tombol" className="text-xs font-semibold">Kelengkungan Sudut Tombol (Radius)</Label>
                    <Select value={borderRadiusTombol} onValueChange={setBorderRadiusTombol}>
                      <SelectTrigger id="border_radius_tombol">
                        <SelectValue placeholder="Gunakan bawaan tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Bawaan Tema</SelectItem>
                        <SelectItem value="0px">Siku-siku (Kotak Kaku)</SelectItem>
                        <SelectItem value="0.25rem">Kecil (Rounded SM)</SelectItem>
                        <SelectItem value="0.5rem">Sedang (Rounded MD)</SelectItem>
                        <SelectItem value="0.75rem">Besar (Rounded LG)</SelectItem>
                        <SelectItem value="1rem">Sangat Besar (Rounded XL)</SelectItem>
                        <SelectItem value="9999px">Kapsul (Rounded Full)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Kustomisasi Warna Tombol kustom */}
                  <div className="pt-4 border-t border-border/40 space-y-4">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Override Warna Tombol (Opsional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Warna Latar Tombol */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Warna Latar Tombol</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                              <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: warnaTombolLatar || "#CCC" }} />
                              <span>{warnaTombolLatar || "Default"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit p-3 bg-card border-border/85">
                            <HexColorPicker color={warnaTombolLatar || "#FFFFFF"} onChange={setWarnaTombolLatar} />
                            <Button size="xs" variant="ghost" onClick={() => setWarnaTombolLatar("")} className="mt-2 w-full">Reset Bawaan</Button>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Warna Teks Tombol */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Warna Teks Tombol</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                              <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: warnaTombolTeks || "#CCC" }} />
                              <span>{warnaTombolTeks || "Default"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit p-3 bg-card border-border/85">
                            <HexColorPicker color={warnaTombolTeks || "#000000"} onChange={setWarnaTombolTeks} />
                            <Button size="xs" variant="ghost" onClick={() => setWarnaTombolTeks("")} className="mt-2 w-full">Reset Bawaan</Button>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Warna Border Tombol */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Warna Border Tombol</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                              <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: warnaTombolBorder || "#CCC" }} />
                              <span>{warnaTombolBorder || "Default"}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-fit p-3 bg-card border-border/85">
                            <HexColorPicker color={warnaTombolBorder || "#000000"} onChange={setWarnaTombolBorder} />
                            <Button size="xs" variant="ghost" onClick={() => setWarnaTombolBorder("")} className="mt-2 w-full">Reset Bawaan</Button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* TABS: MEDIA SOSIAL FOOTER */}
                <TabsContent value="sosmed" className="p-6 space-y-4 outline-none">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Tautan Media Sosial</h3>
                    <p className="text-xs text-muted-foreground">Isi tautan media sosial Anda. Ikon-ikon ini akan ditampilkan di bagian bawah profil sebagai footer navigasi sosial.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_instagram" className="text-xs font-semibold">Username Instagram</Label>
                      <Input
                        id="sosmed_instagram"
                        placeholder="Contoh: karangtaruna.mojosongo"
                        value={sosmedInstagram}
                        onChange={(e) => setSosmedInstagram(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_tiktok" className="text-xs font-semibold">Username TikTok</Label>
                      <Input
                        id="sosmed_tiktok"
                        placeholder="Contoh: kt_mojosongo"
                        value={sosmedTiktok}
                        onChange={(e) => setSosmedTiktok(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_whatsapp" className="text-xs font-semibold">No. WhatsApp (Gunakan Kode Negara)</Label>
                      <Input
                        id="sosmed_whatsapp"
                        placeholder="Contoh: 628123456789"
                        value={sosmedWhatsapp}
                        onChange={(e) => setSosmedWhatsapp(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_facebook" className="text-xs font-semibold">Nama Pengguna / URL Facebook</Label>
                      <Input
                        id="sosmed_facebook"
                        placeholder="Contoh: karangtarunamojosongo"
                        value={sosmedFacebook}
                        onChange={(e) => setSosmedFacebook(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_youtube" className="text-xs font-semibold">Username / Channel ID YouTube</Label>
                      <Input
                        id="sosmed_youtube"
                        placeholder="Contoh: @MojosongoTV"
                        value={sosmedYoutube}
                        onChange={(e) => setSosmedYoutube(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_github" className="text-xs font-semibold">Username GitHub</Label>
                      <Input
                        id="sosmed_github"
                        placeholder="Contoh: mojosongodev"
                        value={sosmedGithub}
                        onChange={(e) => setSosmedGithub(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_email" className="text-xs font-semibold">Alamat Email</Label>
                      <Input
                        id="sosmed_email"
                        type="email"
                        placeholder="Contoh: info@mojosongo.org"
                        value={sosmedEmail}
                        onChange={(e) => setSosmedEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sosmed_telepon" className="text-xs font-semibold">Nomor Telepon</Label>
                      <Input
                        id="sosmed_telepon"
                        placeholder="Contoh: +628123456789"
                        value={sosmedTelepon}
                        onChange={(e) => setSosmedTelepon(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* TABS 3: SEO */}
                <TabsContent value="seo" className="p-6 space-y-4 outline-none">
                  <div className="space-y-2">
                    <Label htmlFor="meta_judul" className="font-semibold text-xs">Meta Title (SEO)</Label>
                    <Input
                      id="meta_judul"
                      placeholder="Masukkan judul pencarian..."
                      value={metaJudul}
                      onChange={(e) => setMetaJudul(e.target.value)}
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_deskripsi" className="font-semibold text-xs">Meta Description (SEO)</Label>
                    <Textarea
                      id="meta_deskripsi"
                      placeholder="Masukkan deskripsi penelusuran Google..."
                      value={metaDeskripsi}
                      onChange={(e) => setMetaDeskripsi(e.target.value)}
                      className="bg-muted/30 min-h-[80px]"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50 p-6 bg-muted/10">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/linktree")}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading || slugTersedia === false} className="gap-2">
                <Save className="size-4" /> {initialData ? "Simpan Perubahan" : "Simpan & Lanjutkan"}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Seksi Kelola Link (Hanya Tampil di Edit Mode) */}
        {initialData && (
          <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="size-4 text-primary" /> Daftar Tautan Link
                </CardTitle>
                <CardDescription className="text-xs">
                  Tambahkan dan susun tautan profil dengan drag and drop.
                </CardDescription>
              </div>
              <Button size="sm" type="button" onClick={() => handleOpenLinkModal()} className="gap-1.5 h-8 text-xs">
                <Plus className="size-3.5" /> Tambah Link
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {links.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/10">
                  <p className="text-xs text-muted-foreground">Belum ada tautan ditambahkan.</p>
                  <Button size="xs" variant="outline" className="mt-3 text-xs" onClick={() => handleOpenLinkModal()}>
                    Tambah Tautan Pertama
                  </Button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {links.map((link) => (
                        <SortableLinkItem
                          key={link.id}
                          link={link}
                          onEdit={handleOpenLinkModal}
                          onDelete={handleDeleteLink}
                          onToggle={handleToggleLinkActive}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Kolom Kanan: Mobile Preview Frame (45%) */}
      <div className="w-full lg:w-[45%] lg:sticky lg:top-6 flex flex-col items-center">
        <div className="relative w-full max-w-[290px] aspect-[9/18] rounded-[36px] border-[8px] border-zinc-900 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col">
          {/* Status notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-32 bg-zinc-900 rounded-b-xl z-20 flex items-center justify-center">
            <span className="size-1 rounded-full bg-zinc-700" />
          </div>

          {/* Virtual Content Scroll Wrapper */}
          <div
            className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center justify-between text-center select-none relative"
            style={{
              background: bgImageUrl ? `url(${bgImageUrl}) center/cover no-repeat` : (warnaLatar || currentTemaConfig.latar),
              fontFamily: currentTemaConfig.font,
              color: warnaPrimer || currentTemaConfig.warna_teks,
            }}
          >
            {/* Dynamic CSS animations inside preview container */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes preview-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
              }
              @keyframes preview-pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(0.97); opacity: 0.9; }
              }
              @keyframes preview-float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-3px); }
              }
              @keyframes preview-wobble {
                0%, 100% { transform: translateX(0); }
                15% { transform: translateX(-3px) rotate(-1deg); }
                30% { transform: translateX(2px) rotate(1deg); }
                45% { transform: translateX(-2px) rotate(-1deg); }
                60% { transform: translateX(1px) rotate(1deg); }
              }
              @keyframes preview-glow {
                0%, 100% { filter: drop-shadow(0 0 2px rgba(255,255,255,0.2)); }
                50% { filter: drop-shadow(0 0 6px rgba(255,255,255,0.6)); }
              }
              .preview-anim-bounce { animation: preview-bounce 2s infinite ease-in-out; }
              .preview-anim-pulse { animation: preview-pulse 2s infinite ease-in-out; }
              .preview-anim-float { animation: preview-float 3s infinite ease-in-out; }
              .preview-anim-wobble { animation: preview-wobble 1s infinite ease-in-out; }
              .preview-anim-glow { animation: preview-glow 2s infinite ease-in-out; }
            `}} />

            <div className="w-full space-y-6 pt-4 flex flex-col items-center z-10">
              {/* Profile Image */}
              {fotoProfilUrl ? (
                <div className="size-16 rounded-full border border-white/20 overflow-hidden shadow-xs shrink-0">
                  <img src={fotoProfilUrl} alt="Avatar" className="object-cover size-full" />
                </div>
              ) : (
                <div className="size-16 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-lg border border-white/10 shrink-0">
                  {judul ? judul.charAt(0).toUpperCase() : "?"}
                </div>
              )}

              {/* Title & Bio */}
              <div className="space-y-1">
                <h2 className="text-sm font-bold truncate max-w-[220px]" style={{ color: warnaPrimer || currentTemaConfig.warna_teks }}>
                  {judul || "Nama Profil Anda"}
                </h2>
                <p className="text-[10px] opacity-85 line-clamp-3 px-3 leading-normal" style={{ color: warnaPrimer || currentTemaConfig.warna_teks_sekunder }}>
                  {bio || "Deskripsi bio singkat halaman Anda akan tampil di bagian ini."}
                </p>
              </div>

              {/* Tautan Links */}
              <div className="w-full space-y-2.5">
                {links.filter((l) => l.aktif).length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-current/20 text-[10px] opacity-60 flex flex-col items-center gap-1">
                    <Link2 className="size-4" /> Tautan belum ditambahkan
                  </div>
                ) : (
                  links
                    .filter((l) => l.aktif)
                    .map((link) => {
                      const activeGaya = gayaTombol && gayaTombol !== "none" ? gayaTombol : currentTemaConfig.gaya_tombol;
                      const solid = activeGaya === "solid" || activeGaya === "brutalist" || activeGaya === "brutalist-offset";
                      const outline = activeGaya === "outline" || activeGaya === "double-border" || activeGaya === "shadow-offset";
                      const glass = activeGaya === "glass";
                      const soft = activeGaya === "soft";

                      // Build dynamic style inline
                      const linkStyle: React.CSSProperties = {
                        borderRadius: borderRadiusTombol && borderRadiusTombol !== "none" ? borderRadiusTombol : currentTemaConfig.border_radius_tombol,
                        fontFamily: currentTemaConfig.font,
                        transition: "all 0.2s ease-in-out",
                      };

                      // Color variables: use override per-link, or profile override, or default theme config
                      const activeBg = link.warna_latar || warnaTombolLatar || currentTemaConfig.warna_tombol_latar;
                      const activeTeks = link.warna_teks || warnaTombolTeks || currentTemaConfig.warna_tombol_teks;
                      const activeBorder = link.warna_border || warnaTombolBorder || currentTemaConfig.warna_tombol_border;

                      if (solid) {
                        linkStyle.backgroundColor = activeBg;
                        linkStyle.color = activeTeks;
                        linkStyle.borderColor = activeBorder;
                        linkStyle.borderWidth = "1px";
                        if (activeGaya === "brutalist") {
                          linkStyle.boxShadow = "4px 4px 0px #000000";
                          linkStyle.borderWidth = "2px";
                        } else if (activeGaya === "brutalist-offset") {
                          linkStyle.boxShadow = "3px 3px 0px 1px #000000";
                          linkStyle.borderWidth = "2px";
                        }
                      } else if (outline) {
                        linkStyle.borderWidth = "1px";
                        linkStyle.borderColor = activeBorder;
                        linkStyle.color = activeTeks;
                        linkStyle.backgroundColor = "transparent";
                        if (activeGaya === "double-border") {
                          linkStyle.borderWidth = "3px";
                          linkStyle.borderStyle = "double";
                        } else if (activeGaya === "shadow-offset") {
                          linkStyle.boxShadow = "2px 2px 8px rgba(0,0,0,0.1)";
                        }
                      } else if (glass) {
                        linkStyle.backgroundColor = activeBg || "rgba(255, 255, 255, 0.08)";
                        linkStyle.color = activeTeks;
                        linkStyle.borderWidth = "1px";
                        linkStyle.borderColor = activeBorder || "rgba(255, 255, 255, 0.2)";
                        linkStyle.backdropFilter = "blur(8px)";
                      } else if (soft) {
                        linkStyle.backgroundColor = activeBg ? `${activeBg}20` : "rgba(128,128,128,0.15)";
                        linkStyle.color = activeTeks;
                        linkStyle.borderWidth = "0px";
                      } else {
                        // fallback
                        linkStyle.backgroundColor = activeBg;
                        linkStyle.color = activeTeks;
                        linkStyle.borderColor = activeBorder;
                      }

                      // Dynamic animation class prefixing
                      const currentAnim = link.animasi || animasiTombol || "none";
                      let animClass = "";
                      if (currentAnim && currentAnim !== "none") {
                        animClass = `preview-anim-${currentAnim}`;
                      }

                      return (
                        <div
                          key={link.id}
                          style={linkStyle}
                          className={`w-full py-2.5 px-4 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs border ${animClass}`}
                        >
                          <div className="size-4 flex items-center justify-center shrink-0">
                            <LinkIcon name={link.ikon || "FaGlobe"} className="size-3.5" style={{ color: link.warna_ikon || undefined }} />
                          </div>
                          <span className="truncate flex-1 text-center pr-4 text-[10px]">{link.judul}</span>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Social Media Footer inside Preview */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-[240px] pt-6 z-10">
              {sosmedInstagram && (
                <a href={`https://instagram.com/${sosmedInstagram}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaInstagram className="size-3.5" />
                </a>
              )}
              {sosmedTiktok && (
                <a href={`https://tiktok.com/@${sosmedTiktok}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaTiktok className="size-3.5" />
                </a>
              )}
              {sosmedWhatsapp && (
                <a href={`https://wa.me/${sosmedWhatsapp}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaWhatsapp className="size-3.5" />
                </a>
              )}
              {sosmedFacebook && (
                <a href={sosmedFacebook.startsWith("http") ? sosmedFacebook : `https://facebook.com/${sosmedFacebook}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaFacebook className="size-3.5" />
                </a>
              )}
              {sosmedYoutube && (
                <a href={sosmedYoutube.startsWith("http") ? sosmedYoutube : `https://youtube.com/${sosmedYoutube}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaYoutube className="size-3.5" />
                </a>
              )}
              {sosmedGithub && (
                <a href={`https://github.com/${sosmedGithub}`} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaGithub className="size-3.5" />
                </a>
              )}
              {sosmedEmail && (
                <a href={`mailto:${sosmedEmail}`} className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaEnvelope className="size-3.5" />
                </a>
              )}
              {sosmedTelepon && (
                <a href={`tel:${sosmedTelepon}`} className="opacity-80 hover:opacity-100 transition-opacity">
                  <FaIcons.FaPhone className="size-3.5" />
                </a>
              )}
            </div>

            {/* Bottom Credit */}
            <div className="pt-4 text-[8px] opacity-40 font-mono tracking-wider z-10">
              POWERED BY MOJOSONGO
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah/Edit Link */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/80 p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedLink ? "Edit Tautan Link" : "Tambah Tautan Link baru"}</DialogTitle>
            <DialogDescription className="text-xs">Isi parameter tautan di bawah ini.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="link_judul" className="text-xs font-semibold">Judul Link <span className="text-red-500">*</span></Label>
              <Input id="link_judul" placeholder="Contoh: Ikuti Instagram Kami" value={linkJudul} onChange={(e) => setLinkJudul(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link_url" className="text-xs font-semibold">URL Tujuan <span className="text-red-500">*</span></Label>
              <Input id="link_url" type="url" placeholder="https://instagram.com/karangtaruna" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pilih Ikon Platform</Label>
                <Select value={linkIkon} onValueChange={setLinkIkon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Warna Ikon (Opsional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                      <span className="size-3.5 rounded-full border border-border" style={{ backgroundColor: linkWarnaIkon || "#CCC" }} />
                      <span>{linkWarnaIkon || "Default"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-3 bg-card border-border/85">
                    <HexColorPicker color={linkWarnaIkon || "#000000"} onChange={setLinkWarnaIkon} />
                    <Button size="xs" variant="ghost" onClick={() => setLinkWarnaIkon("")} className="mt-2 w-full">Default</Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/20 border border-border/40 p-3 rounded-lg">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">Aktifkan Tautan</p>
                <p className="text-[10px] text-muted-foreground">Tautan tidak akan tampil jika dinonaktifkan.</p>
              </div>
              <Switch checked={linkAktif} onCheckedChange={setLinkAktif} />
            </div>

            {/* Override styling per link */}
            <div className="pt-4 border-t border-border/40 space-y-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Override Desain Link (Opsional)</p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Warna Latar Override */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Override Warna Latar</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                        <span className="size-3 rounded-full border border-border" style={{ backgroundColor: linkWarnaLatar || "#CCC" }} />
                        <span>{linkWarnaLatar || "Default"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-3 bg-card border-border/85 z-50">
                      <HexColorPicker color={linkWarnaLatar || "#FFFFFF"} onChange={setLinkWarnaLatar} />
                      <Button size="xs" variant="ghost" onClick={() => setLinkWarnaLatar("")} className="mt-2 w-full">Gunakan Default</Button>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Warna Teks Override */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Override Warna Teks</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                        <span className="size-3 rounded-full border border-border" style={{ backgroundColor: linkWarnaTeks || "#CCC" }} />
                        <span>{linkWarnaTeks || "Default"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-3 bg-card border-border/85 z-50">
                      <HexColorPicker color={linkWarnaTeks || "#000000"} onChange={setLinkWarnaTeks} />
                      <Button size="xs" variant="ghost" onClick={() => setLinkWarnaTeks("")} className="mt-2 w-full">Gunakan Default</Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Warna Border Override */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold">Override Warna Border</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2 bg-muted/20 border-border/60 text-xs">
                        <span className="size-3 rounded-full border border-border" style={{ backgroundColor: linkWarnaBorder || "#CCC" }} />
                        <span>{linkWarnaBorder || "Default"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-fit p-3 bg-card border-border/85 z-50">
                      <HexColorPicker color={linkWarnaBorder || "#000000"} onChange={setLinkWarnaBorder} />
                      <Button size="xs" variant="ghost" onClick={() => setLinkWarnaBorder("")} className="mt-2 w-full">Gunakan Default</Button>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Override Animasi Dropdown */}
                <div className="space-y-1.5">
                  <Label htmlFor="link_animasi" className="text-[11px] font-semibold">Override Animasi</Label>
                  <Select value={linkAnimasi} onValueChange={setLinkAnimasi}>
                    <SelectTrigger id="link_animasi">
                      <SelectValue placeholder="Bawaan profil" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="none">Tanpa Animasi</SelectItem>
                      <SelectItem value="pulse">Pulse (Denyut)</SelectItem>
                      <SelectItem value="bounce">Bounce (Memantul)</SelectItem>
                      <SelectItem value="float">Float (Melayang)</SelectItem>
                      <SelectItem value="wobble">Wobble (Goyang)</SelectItem>
                      <SelectItem value="glow">Glow (Bercahaya)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsLinkModalOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveLink}>
              Simpan Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
