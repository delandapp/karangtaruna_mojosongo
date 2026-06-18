"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import {
  Loader2,
  Calendar,
  List,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Inbox,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Clock,
} from "lucide-react";
import {
  useGetDaftarKontenQuery,
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
} from "@/features/api/sosialMediaApi";
import { FormKonten } from "../forms/FormKonten";
import { KalenderKonten } from "./KalenderKonten";
import { ModalKonfirmasiHapusKonten } from "../modals/sosial-media/konten/ModalKonfirmasiHapusKonten";
import { ModalPublishSekarang } from "../modals/sosial-media/konten/ModalPublishSekarang";
import { ComboBox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentPageProps {
  initialPlatformSlug?: string;
}

export function ContentPage({ initialPlatformSlug }: ContentPageProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<"draft" | "scheduled" | "published" | "failed" | "semua">("semua");

  // Modal confirm state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [selectedKonten, setSelectedKonten] = useState<any>(null);

  // Load platforms and accounts
  const { data: platformResponse } = useGetDaftarPlatformQuery();
  const { data: accountsResponse } = useGetAkunByPlatformQuery();

  const platforms = platformResponse?.data || [];
  const accounts = accountsResponse?.data || [];

  // Set initial platform slug if provided
  useState(() => {
    if (initialPlatformSlug && platforms.length > 0) {
      const match = platforms.find(
        (p) => p.slug.toLowerCase() === initialPlatformSlug.toLowerCase()
      );
      if (match) {
        setSelectedPlatformId(match.id);
      }
    }
  });

  const queryFilters = {
    platform_id: selectedPlatformId,
    status: selectedStatus === "semua" ? undefined : selectedStatus,
    search: searchTerm.trim() || undefined,
  };

  // Fetch content list
  const {
    data: kontenResponse,
    isLoading: isLoadingKonten,
    refetch: refetchKonten,
  } = useGetDaftarKontenQuery(queryFilters);

  const kontenList = kontenResponse?.data || [];

  const handleOpenCreateForm = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (konten: any) => {
    setEditingData(konten);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (e: React.MouseEvent, konten: any) => {
    e.stopPropagation();
    setSelectedKonten(konten);
    setIsDeleteOpen(true);
  };

  const handleOpenPublish = (e: React.MouseEvent, konten: any) => {
    e.stopPropagation();
    setSelectedKonten(konten);
    setIsPublishOpen(true);
  };

  const handleSelectFromCalendar = (konten: any) => {
    handleOpenEditForm(konten);
  };

  const getPlatformIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="size-4 text-blue-600 dark:text-blue-400" />;
      case "instagram":
        return <FaInstagram className="size-4 text-pink-500" />;
      case "tiktok":
        return <FaTiktok className="size-4 text-foreground" />;
      case "whatsapp":
        return <FaWhatsapp className="size-4 text-emerald-500" />;
      case "twitter":
        return <FaTwitter className="size-4 text-sky-400" />;
      default:
        return <Inbox className="size-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-full font-medium gap-1 text-[10px]">
            <FileText className="size-3" /> Draft
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 rounded-full font-medium gap-1 text-[10px]">
            <Clock className="size-3" /> Scheduled
          </Badge>
        );
      case "published":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full font-medium gap-1 text-[10px]">
            <CheckCircle className="size-3" /> Published
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="rounded-full font-medium gap-1 text-[10px]">
            <XCircle className="size-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 rounded-full font-medium gap-1 text-[10px]">
            <HelpCircle className="size-3" /> {status}
          </Badge>
        );
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: localeId,
      });
    } catch {
      return "";
    }
  };

  // Convert platforms to ComboBoxItem structure
  const platformOptions = [
    { id: 0, nama: "Semua Platform" },
    ...platforms,
  ];

  const currentSelectedPlatform = platformOptions.find((p) => p.id === (selectedPlatformId || 0));

  // Render form view instead of listing
  if (isFormOpen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {editingData ? "✏️ Edit Konten Postingan" : "➕ Buat Konten Postingan Baru"}
          </h2>
          <Button
            variant="outline"
            onClick={() => setIsFormOpen(false)}
            className="rounded-xl h-9 text-xs"
          >
            Kembali ke Daftar
          </Button>
        </div>
        <FormKonten
          initialData={editingData}
          onSuccess={() => {
            setIsFormOpen(false);
            refetchKonten();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Manajemen Konten</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Buat, jadwalkan, dan kelola penerbitan konten postingan Anda ke seluruh platform media sosial.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex bg-muted/50 p-1 border rounded-xl shrink-0">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 rounded-lg"
              title="List View"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("calendar")}
              className="h-8 w-8 rounded-lg"
              title="Calendar View"
            >
              <Calendar className="size-4" />
            </Button>
          </div>
          <Button
            onClick={handleOpenCreateForm}
            className="shadow-md rounded-xl font-semibold gap-1.5 h-9 text-xs shrink-0"
          >
            <Plus className="size-4" />
            Buat Konten Baru
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl">
        <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Left search */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari konten..."
              className="pl-9 bg-muted/40 focus-visible:ring-primary/50"
            />
          </div>

          {/* Middle Tabs for Status */}
          <Tabs
            value={selectedStatus}
            onValueChange={(val: any) => setSelectedStatus(val)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-5 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="semua" className="rounded-lg text-xs font-semibold px-3">
                Semua
              </TabsTrigger>
              <TabsTrigger value="draft" className="rounded-lg text-xs font-semibold px-3">
                Draft
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="rounded-lg text-xs font-semibold px-3">
                Terjadwal
              </TabsTrigger>
              <TabsTrigger value="published" className="rounded-lg text-xs font-semibold px-3">
                Terposting
              </TabsTrigger>
              <TabsTrigger value="failed" className="rounded-lg text-xs font-semibold px-3">
                Gagal
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right Platform Filter */}
          <div className="w-full md:max-w-[200px] shrink-0">
            <ComboBox
              title="Platform"
              data={platformOptions}
              selected={currentSelectedPlatform}
              onChange={(val: any) => {
                setSelectedPlatformId(val?.id === 0 ? undefined : val?.id);
              }}
              valueKey="id"
              labelKey="nama"
            />
          </div>
        </CardContent>
      </Card>

      {/* Render Main Content View */}
      {viewMode === "calendar" ? (
        <KalenderKonten kontenList={kontenList} onSelectKonten={handleSelectFromCalendar} />
      ) : isLoadingKonten ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      ) : kontenList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-6 text-center">
          <Inbox className="size-12 text-muted-foreground/50 mb-3" />
          <p className="text-base font-semibold">Tidak ada konten ditemukan</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Tidak ada konten postingan yang sesuai dengan filter atau kriteria pencarian Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kontenList.map((konten) => {
            const hasMedia = konten.media && konten.media.length > 0;
            const mediaUrl = hasMedia ? konten.media?.[0]?.url ?? "" : "";
            const isVideo = hasMedia && ["mp4", "mov", "avi", "webm"].includes(mediaUrl.split("?")[0].split(".").pop()?.toLowerCase() || "");

            return (
              <Card
                key={konten.id}
                onClick={() => handleOpenEditForm(konten)}
                className="hover:border-primary/30 transition-all border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col justify-between shadow-xs rounded-2xl cursor-pointer"
              >
                <CardContent className="p-5 flex gap-4 items-start">
                  {/* Media Thumbnail */}
                  {hasMedia ? (
                    <div className="size-20 rounded-xl overflow-hidden bg-muted/40 shrink-0 border border-border/40">
                      {isVideo ? (
                        <video src={mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl} alt="Konten Thumbnail" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="size-20 rounded-xl bg-muted/40 shrink-0 flex items-center justify-center border border-border/40 text-muted-foreground">
                      <FileText className="size-6" />
                    </div>
                  )}

                  {/* Content details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        @{konten.akun?.username}
                      </span>
                      {getStatusBadge(konten.status)}
                    </div>
                    <p className="text-xs text-foreground font-medium line-clamp-2 leading-relaxed">
                      {konten.caption || "(Tanpa Caption)"}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Badge className="bg-muted hover:bg-muted text-muted-foreground capitalize text-[9px] py-0 px-2 rounded-full font-medium">
                        {konten.tipe_konten}
                      </Badge>
                      <div className="flex gap-1">
                        {konten.platform?.map((p: any, idx: number) => (
                          <div key={idx} className="bg-muted/40 border border-border/30 p-1 rounded-md">
                            {getPlatformIcon(p.platform?.slug || "")}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Footer and action bar */}
                <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between gap-4">
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {konten.status === "scheduled" && konten.dijadwalkan_pada
                      ? `Jadwal: ${formatTime(konten.dijadwalkan_pada)}`
                      : konten.status === "published" && konten.diposting_pada
                        ? `Terposting: ${formatTime(konten.diposting_pada)}`
                        : `Dibuat: ${formatTime(konten.dibuat_pada)}`}
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    {(konten.status === "draft" || konten.status === "scheduled") && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => handleOpenPublish(e, konten)}
                          className="h-7 w-7 rounded-lg text-primary hover:bg-primary/5 hover:text-primary border-border/50"
                          title="Publish Sekarang"
                        >
                          <Send className="size-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditForm(konten);
                          }}
                          className="h-7 w-7 rounded-lg text-foreground hover:bg-muted border-border/50"
                          title="Edit"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => handleOpenDelete(e, konten)}
                      className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive border-border/50"
                      title="Hapus"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedKonten && (
        <>
          <ModalKonfirmasiHapusKonten
            isOpen={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            kontenId={selectedKonten.id}
            kontenCaption={selectedKonten.caption || ""}
            onSuccess={refetchKonten}
          />
          <ModalPublishSekarang
            isOpen={isPublishOpen}
            onOpenChange={setIsPublishOpen}
            kontenId={selectedKonten.id}
            platforms={selectedKonten.platform?.map((p: any) => p.platform) || []}
            onSuccess={refetchKonten}
          />
        </>
      )}
    </div>
  );
}

// Simple wrapper search icon
function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
