"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaTwitter,
} from "react-icons/fa";
import {
  Loader2,
  Search,
  MessageSquare,
  Archive,
  Inbox,
  CheckCircle,
} from "lucide-react";
import {
  useGetDaftarChatQuery,
  useGetDaftarPlatformQuery,
  useUpdateStatusChatMutation,
  useGetUnreadCountQuery,
} from "@/features/api/sosialMediaApi";
import { ModalDetailPercakapan } from "../modals/sosial-media/chat/ModalDetailPercakapan";
import { ComboBox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatPageProps {
  initialPlatformSlug?: string;
}

export function ChatPage({ initialPlatformSlug }: ChatPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<"baru" | "dijawab" | "diarsipkan" | "semua">("baru");
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Load platforms to map slugs/names
  const { data: platformResponse } = useGetDaftarPlatformQuery();
  const platforms = platformResponse?.data || [];

  // Automatically set initial platform filter if initialPlatformSlug is provided
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

  // Filters payload
  const filters = {
    platform_id: selectedPlatformId,
    status: selectedStatus === "semua" ? undefined : selectedStatus,
    search: searchTerm.trim() || undefined,
  };

  // Fetch chat threads with a 30 second polling interval
  const {
    data: chatResponse,
    isLoading: isLoadingChats,
    refetch: refetchChats,
  } = useGetDaftarChatQuery(filters, {
    pollingInterval: 30000,
  });

  const chats = chatResponse?.data || [];

  // Fetch unread count for sidebar/badges
  const { data: unreadResponse, refetch: refetchUnread } = useGetUnreadCountQuery();
  const unreadCount = unreadResponse?.data?.total || 0;

  const [updateStatusChat] = useUpdateStatusChatMutation();

  // Helper: Get react-icon for platform slug
  const getPlatformIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="size-5 text-blue-600 dark:text-blue-400" />;
      case "instagram":
        return <FaInstagram className="size-5 text-pink-500" />;
      case "tiktok":
        return <FaTiktok className="size-5 text-foreground" />;
      case "whatsapp":
        return <FaWhatsapp className="size-5 text-emerald-500" />;
      case "twitter":
        return <FaTwitter className="size-5 text-sky-400" />;
      default:
        return <MessageSquare className="size-5 text-primary" />;
    }
  };

  const handleOpenChat = (chatId: number) => {
    setActiveChatId(chatId);
    setIsDetailOpen(true);
    // Refetch unread counts as opening chat will mark it as read
    setTimeout(() => {
      refetchChats();
      refetchUnread();
    }, 500);
  };

  const handleArchiveChat = async (e: React.MouseEvent, chatId: number) => {
    e.stopPropagation();
    try {
      await updateStatusChat({ id: chatId, status: "diarsipkan" }).unwrap();
      refetchChats();
      refetchUnread();
    } catch (error) {
      // Quiet fail or log
    }
  };

  const formatTime = (dateStr: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Inbox Sosial Media</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Baca dan balas pesan pelanggan dari berbagai platform media sosial dalam satu dasbor.
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 text-xs rounded-full gap-1.5 self-start sm:self-auto">
            <Inbox className="size-3.5" />
            {unreadCount} Pesan Belum Dibaca
          </Badge>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl">
        <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Left search */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari percakapan..."
              className="pl-9 bg-muted/40 focus-visible:ring-primary/50"
            />
          </div>

          {/* Middle Tabs for Status */}
          <Tabs
            value={selectedStatus}
            onValueChange={(val: any) => setSelectedStatus(val)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="baru" className="rounded-lg text-xs font-semibold px-3">
                Baru
              </TabsTrigger>
              <TabsTrigger value="dijawab" className="rounded-lg text-xs font-semibold px-3">
                Dijawab
              </TabsTrigger>
              <TabsTrigger value="diarsipkan" className="rounded-lg text-xs font-semibold px-3">
                Arsip
              </TabsTrigger>
              <TabsTrigger value="semua" className="rounded-lg text-xs font-semibold px-3">
                Semua
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

      {/* Chat Threads List */}
      {isLoadingChats ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-6 text-center">
          <Inbox className="size-12 text-muted-foreground/50 mb-3" />
          <p className="text-base font-semibold">Tidak ada percakapan</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Tidak ada pesan masuk yang sesuai dengan filter pencarian Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleOpenChat(chat.id)}
              className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer hover:bg-muted/10 transition-all group relative overflow-hidden
                ${!chat.sudah_dibaca ? "bg-primary/5 dark:bg-primary/10 border-primary/20" : "bg-card border-border/60"}`}
            >
              {/* Unread dot indicator */}
              {!chat.sudah_dibaca && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}

              {/* Platform Icon Badge */}
              <div className="bg-muted/60 p-2.5 rounded-xl border border-border/40 shrink-0">
                {getPlatformIcon(chat.akun?.platform?.slug || "")}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate max-w-[150px] sm:max-w-sm">
                      {chat.sender_nama}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      @{chat.akun?.username}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatTime(chat.dibuat_pada)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate leading-relaxed">
                  {chat.pesan}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {/* Status Badge */}
                  {chat.status === "baru" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50 text-[9px] py-0 px-2 rounded-full font-medium">
                      Baru
                    </Badge>
                  )}
                  {chat.status === "dijawab" && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50 text-[9px] py-0 px-2 rounded-full font-medium gap-1">
                      <CheckCircle className="size-2.5" />
                      Dijawab
                    </Badge>
                  )}
                  {chat.status === "diarsipkan" && (
                    <Badge variant="outline" className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 border-zinc-200/50 text-[9px] py-0 px-2 rounded-full font-medium">
                      Diarsipkan
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action buttons on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 self-center shrink-0">
                {chat.status !== "diarsipkan" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleArchiveChat(e, chat.id)}
                    className="h-8 w-8 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                    title="Arsipkan"
                  >
                    <Archive className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detail Percakapan */}
      {activeChatId && (
        <ModalDetailPercakapan
          isOpen={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          chatId={activeChatId}
        />
      )}
    </div>
  );
}
