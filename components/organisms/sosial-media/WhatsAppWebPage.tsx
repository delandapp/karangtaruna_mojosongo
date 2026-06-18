"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useTheme } from "next-themes";
import {
  Search, Send, Paperclip, Smile, ArrowLeft,
  Check, CheckCheck, FileText, X, Info, Archive,
  MessageSquareDashed, Loader2, Users, Plus, Trash2,
  Edit, ChevronDown, UserPlus, Phone, Video
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  useGetAkunByPlatformQuery, useGetDaftarPlatformQuery,
  useGetDaftarChatQuery,
  useBalasChatMutation, useUpdateStatusChatMutation,
  useGetDaftarKontakQuery, useBuatKontakMutation, useUpdateKontakMutation,
  useBuatChatMutation, useHapusPesanMutation, useClearChatMutation,
} from "@/features/api/sosialMediaApi";
import { Chat, BalasanChat, AkunSosmed, KontakWA } from "@/lib/types/sosial-media.types";

// ═══════════════════════════════════════════════════════
// THEME SYSTEM (iOS Overhaul)
// ═══════════════════════════════════════════════════════

interface WaTheme {
  bg: string;            // outer container / chat list
  header: string;        // top bars
  input: string;         // input area
  inputField: string;    // textarea / search bg
  border: string;
  msgBg: string;         // chat window background
  bubbleIn: string;      // incoming bubble
  bubbleOut: string;     // outgoing bubble
  text: string;
  textMuted: string;
  accent: string;        // iOS blue / green
  accentText: string;    // text on accent bg
  rowHover: string;
  rowActive: string;
  separator: string;     // date separator pill
  senderLabel: string;   // group member name label
}

const DARK: WaTheme = {
  bg: "#000000",          // True black for iOS dark mode
  header: "rgba(22, 22, 22, 0.85)", // Glassmorphism dark
  input: "#161616",
  inputField: "#2c2c2e",
  border: "#1c1c1e",      // iOS system border
  msgBg: "#0B141A",
  bubbleIn: "#1c1c1e",
  bubbleOut: "#054740",
  text: "#ffffff",
  textMuted: "#8e8e93",   // iOS system gray
  accent: "#30d158",      // iOS system green
  accentText: "#ffffff",
  rowHover: "#1c1c1e",
  rowActive: "#2c2c2e",
  separator: "#1c1c1e",
  senderLabel: "#0a84ff",  // iOS link blue
};

const LIGHT: WaTheme = {
  bg: "#ffffff",          // Clean white for iOS light mode
  header: "rgba(249, 249, 249, 0.94)", // Glassmorphism light
  input: "#f6f6f6",
  inputField: "#e3e3e9",   // iOS Search bar background
  border: "#e5e5ea",      // iOS system border
  msgBg: "#efeae2",       // Classic WA beige
  bubbleIn: "#ffffff",
  bubbleOut: "#d9fdd3",
  text: "#000000",
  textMuted: "#8e8e93",   // iOS system gray
  accent: "#34c759",      // iOS system green
  accentText: "#ffffff",
  rowHover: "#f2f2f7",    // iOS hover grey
  rowActive: "#e5e5ea",   // iOS selected grey
  separator: "#ffffff",
  senderLabel: "#007aff",  // iOS link blue
};

// ═══════════════════════════════════════════════════════
// EMOJI PANEL
// ═══════════════════════════════════════════════════════

const EMOJI_GROUPS = [
  { label: "😊", emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","🙂","🤗","🤩","🤔","😐","🙄","😏","😣","😥","😮","😪","😴","😛","😜","😝","😒","😓","😔","😕","🙃","😲","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩","🤯","😬","😰","😱","🥵","😳","🤪","😵","😡","😠","🤬","😷","🤒","🤕","🤢","🤮","🤧","😇","🥳","🥺","🤠","👻","😈","👿","🤖","🎃"] },
  { label: "👋", emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💪","🦾","👁","👀","🫶"] },
  { label: "❤️", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","💗","💓","💞","💕","💟","❣️","💝","💘","💖","💌","💋","💯","🔥","✨","⭐","🌟","💫","⚡","❄️","🌈","🎉","🎊","🎈","🎁","🏆","🥇"] },
  { label: "🌿", emojis: ["🌸","🌺","🌻","🌹","🥀","🌷","🌱","🪴","🌿","☘️","🍀","🌾","💐","🌵","🌴","🌳","🌲","🎄","🌊","🌬","🌀","🌈","🦁","🐯","🐻","🐼","🦊","🐺","🐴","🦄","🐘","🐬","🐋","🦈","🐊","🦅","🦜","🐠","🐙","🦋"] },
  { label: "🍕", emojis: ["🍕","🍔","🌮","🌯","🥙","🥗","🍜","🍱","🍣","🍤","🍦","🎂","🧁","🍰","🍩","🍫","🍬","🍭","🥤","☕","🍵","🍺","🍷","🥂","🥃","🧃","🥛"] },
  { label: "🚗", emojis: ["🚗","🚕","🚙","🚌","🏎","🚓","🤷","🚒","✈️","🚀","🛸","🛳","🚢","🚂","🚁","🏠","🏢","🏦","🏥","🏪","⛪","🏯","🗼","🗽","🗺","🌍","🌎","🌏","🧭","🌋","⛰","🏔"] },
  { label: "⚽", emojis: ["⚽","🏀","🏈","⚾","🥎","🏐","🏉","🎾","🏓","🏸","🥊","🎽","🎿","🛷","🛹","🎯","🎱","🎮","🕹","🎲","🎭","🎨","🎵","🎶","🎸","🎺","🥁","🎻","🎤","🎧","📷","📸","📱"] },
];

function EmojiPanel({ onSelect, onClose, theme }: { onSelect: (e: string) => void; onClose: () => void; theme: WaTheme }) {
  const [activeGroup, setActiveGroup] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-16 left-2 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: theme.header, border: `1px solid ${theme.border}`, backdropFilter: "blur(20px)" }}
    >
      <div className="flex border-b overflow-x-auto" style={{ borderColor: theme.border }}>
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={i}
            onClick={() => setActiveGroup(i)}
            className="flex-shrink-0 px-3 py-2 text-base transition-colors"
            style={{
              borderBottom: activeGroup === i ? `2px solid ${theme.accent}` : "2px solid transparent",
              opacity: activeGroup === i ? 1 : 0.5,
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0 p-2 h-48 overflow-y-auto">
        {EMOJI_GROUPS[activeGroup].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="flex items-center justify-center w-8 h-8 text-xl rounded-lg transition-colors hover:scale-110"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.inputField)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════

const isGroup = (senderId?: string | null) => senderId?.endsWith("@g.us") ?? false;

function formatChatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Kemarin";
    return format(d, "dd/MM/yy");
  } catch { return ""; }
}

function formatMessageTime(dateStr: string): string {
  try { return format(new Date(dateStr), "HH:mm"); } catch { return ""; }
}

function formatSectionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return "HARI INI";
    if (isYesterday(d)) return "KEMARIN";
    return format(d, "dd MMMM yyyy", { locale: localeId }).toUpperCase();
  } catch { return ""; }
}

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]?.toUpperCase() || "").join("");
}

function getAvatarColor(name: string): string {
  const colors = ["#25D366","#128C7E","#075E54","#34B7F1","#a78bfa","#f472b6","#34d399","#fb923c","#60a5fa","#f87171","#4ade80","#facc15"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

const GROUP_COLORS = ["#e06c75","#61afef","#98c379","#e5c07b","#c678dd","#56b6c2","#be5046","#528bff"];
function getMemberColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return GROUP_COLORS[hash % GROUP_COLORS.length];
}

interface AttachmentPreview {
  name: string; mimeType: string; base64: string; size: number; previewUrl?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res((reader.result as string).split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MessageItem {
  id: string; type: "incoming" | "outgoing"; text: string;
  time: string; rawDate: string; delivered: boolean; senderName?: string;
}

// ═══════════════════════════════════════════════════════
// AVATAR
// ═══════════════════════════════════════════════════════

function Avatar({ name, size = 40, isGroupChat = false }: { name: string; size?: number; isGroupChat?: boolean }) {
  const bg = isGroupChat ? "#008069" : getAvatarColor(name);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 select-none border border-black/5"
      style={{ width: size, height: size, background: bg, color: "#fff", fontSize: size * 0.36 }}
    >
      {isGroupChat ? (
        <Users style={{ width: size * 0.5, height: size * 0.5 }} />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export function WhatsAppWebPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const t = isDark ? DARK : LIGHT;

  const [selectedAkunId, setSelectedAkunId] = useState<number | null>(null);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups">("all");
  const [messageText, setMessageText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sseStatus, setSseStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");

  // Modals / Dropdowns
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newChatNumber, setNewChatNumber] = useState("");
  const [newChatSearchContact, setNewChatSearchContact] = useState("");
  const [newContactForm, setNewContactForm] = useState({
    nama: "",
    nomor_telp: "",
    email: "",
    perusahaan: "",
    jabatan: "",
    catatan: "",
  });

  const hasSelection = selectedSenderId !== null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  // ── Queries & Mutations ──
  const { data: platformRes } = useGetDaftarPlatformQuery();
  const whatsappPlatform = platformRes?.data?.find((p) => p.slug === "whatsapp");
  const { data: akunRes } = useGetAkunByPlatformQuery(whatsappPlatform?.id, { skip: !whatsappPlatform });
  const akunList: AkunSosmed[] = akunRes?.data || [];
  const connectedAkun = akunList.filter((a) => a.status === "terhubung");

  useEffect(() => {
    if (connectedAkun.length > 0 && !selectedAkunId) setSelectedAkunId(connectedAkun[0].id);
  }, [connectedAkun.length]);

  const { data: chatListRes, refetch: refetchChatList, isLoading: isLoadingChatList } =
    useGetDaftarChatQuery(
      { akun_id: selectedAkunId || undefined, search: searchTerm.trim() || undefined },
      { skip: !selectedAkunId, pollingInterval: 0 }
    );
  const chatList: Chat[] = chatListRes?.data || [];

  // Fetch contacts continuously so we can map sender display names
  const { data: kontakRes, refetch: refetchKontak } = useGetDaftarKontakQuery(
    { akun_id: selectedAkunId! },
    { skip: !selectedAkunId }
  );
  const kontakList: KontakWA[] = kontakRes?.data || [];

  // Mutations
  const [balasChat] = useBalasChatMutation();
  const [updateStatus] = useUpdateStatusChatMutation();
  const [buatKontak] = useBuatKontakMutation();
  const [updateKontak] = useUpdateKontakMutation();
  const [buatChat] = useBuatChatMutation();
  const [hapusPesan] = useHapusPesanMutation();
  const [clearChat] = useClearChatMutation();

  // Helper to resolve display name using kontakList mapping
  const getSenderDisplayNama = useCallback((senderId: string, fallbackName: string) => {
    if (senderId.endsWith("@g.us")) return fallbackName;
    const phone = senderId.replace("@c.us", "").replace("@g.us", "");
    const matchingContact = kontakList.find((k) => k.nomor_telp === phone);
    return matchingContact ? matchingContact.nama : fallbackName;
  }, [kontakList]);

  // Helper to retrieve latest message (content, time, origin) for a given sender_id
  const getLatestMessageInfo = useCallback((senderId: string) => {
    const senderChats = chatList.filter((c) => c.sender_id === senderId);
    let latestText = "";
    let latestDate = new Date(0);
    let isOutgoing = false;

    for (const c of senderChats) {
      const cDate = new Date(c.dibuat_pada);
      if (cDate > latestDate) {
        latestDate = cDate;
        latestText = c.pesan;
        isOutgoing = false;
      }
      for (const b of (c.balasan || [])) {
        const bDate = new Date(b.dibuat_pada);
        if (bDate > latestDate) {
          latestDate = bDate;
          latestText = b.isi_balasan;
          isOutgoing = !b.dikirim_oleh.startsWith("incoming:");
        }
      }
    }

    return {
      text: latestText,
      date: latestDate.getTime() > 0 ? latestDate.toISOString() : null,
      isOutgoing,
    };
  }, [chatList]);

  // Deduplicate, Filter, & Group all chats (both individual and group) by sender_id
  const displayChatList = useMemo(() => {
    const seen = new Map<string, Chat>();
    for (const chat of chatList) {
      if (!chat.sender_id) continue;
      const key = chat.sender_id;
      const existing = seen.get(key);

      const chatInfo = getLatestMessageInfo(chat.sender_id);
      const chatTs = chatInfo.date ? new Date(chatInfo.date).getTime() : 0;

      const existingInfo = existing ? getLatestMessageInfo(existing.sender_id) : null;
      const existingTs = existingInfo && existingInfo.date ? new Date(existingInfo.date).getTime() : 0;

      if (!existing || chatTs > existingTs) {
        seen.set(key, chat);
      }
    }

    let result = Array.from(seen.values());

    // Apply Segmented Filters
    if (activeFilter === "unread") {
      result = result.filter((chat) => {
        const allChatsForSender = chatList.filter((c) => c.sender_id === chat.sender_id);
        return allChatsForSender.some((c) => !c.sudah_dibaca);
      });
    } else if (activeFilter === "groups") {
      result = result.filter((chat) => isGroup(chat.sender_id));
    }

    return result.sort((a, b) => {
      const aInfo = getLatestMessageInfo(a.sender_id!);
      const bInfo = getLatestMessageInfo(b.sender_id!);
      const aTs = aInfo.date ? new Date(aInfo.date).getTime() : 0;
      const bTs = bInfo.date ? new Date(bInfo.date).getTime() : 0;
      return bTs - aTs;
    });
  }, [chatList, getLatestMessageInfo, activeFilter]);

  // Get all chats for the selected sender_id
  const activeChatsForSender = useMemo(() => {
    if (!selectedSenderId) return [];
    return [...chatList]
      .filter((c) => c.sender_id === selectedSenderId)
      .sort((a, b) => new Date(a.dibuat_pada).getTime() - new Date(b.dibuat_pada).getTime());
  }, [chatList, selectedSenderId]);

  // Representative chat info (header, kontak details, etc.)
  const activeChat: Chat | null = activeChatsForSender[activeChatsForSender.length - 1] || null;

  const activeChatKontak = useMemo(() => {
    if (!activeChat?.sender_id) return null;
    const phone = activeChat.sender_id.replace("@c.us", "").replace("@g.us", "");
    return kontakList.find((k) => k.nomor_telp === phone) || null;
  }, [kontakList, activeChat?.sender_id]);

  // Filter contacts based on modal search input
  const filteredNewChatContacts = useMemo(() => {
    if (!newChatSearchContact.trim()) return kontakList;
    return kontakList.filter(
      (c) =>
        c.nama.toLowerCase().includes(newChatSearchContact.toLowerCase()) ||
        c.nomor_telp.includes(newChatSearchContact)
    );
  }, [kontakList, newChatSearchContact]);

  // ── SSE ──
  useEffect(() => {
    if (!selectedAkunId) return;
    setSseStatus("connecting");
    const sse = new EventSource(`/api/sosial-media/chat/stream?akun_id=${selectedAkunId}`);
    sseRef.current = sse;
    sse.addEventListener("connected", () => setSseStatus("connected"));
    sse.addEventListener("ping", () => {});
    sse.addEventListener("status_change", () => { refetchChatList(); });
    sse.addEventListener("chat_update", () => { refetchChatList(); });
    sse.onerror = () => setSseStatus("disconnected");
    return () => { sse.close(); sseRef.current = null; };
  }, [selectedAkunId]);

  // ── Fallback refresh ──
  useEffect(() => {
    if (!selectedAkunId) return;
    const id = setInterval(() => { refetchChatList(); }, 10000);
    return () => clearInterval(id);
  }, [selectedAkunId]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.balasan?.length, selectedSenderId, activeChatsForSender.length]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    const ta = textAreaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const isImage = file.type.startsWith("image/");
    setAttachment({ name: file.name, mimeType: file.type, base64, size: file.size, previewUrl: isImage ? URL.createObjectURL(file) : undefined });
    e.target.value = "";
  };

  const handleSend = useCallback(async () => {
    const targetChatId = activeChat?.id ?? null;
    if (!targetChatId || isSending || (!messageText.trim() && !attachment)) return;
    setIsSending(true);
    setShowEmoji(false);
    try {
      await balasChat({
        chat_id: targetChatId,
        isi_balasan: messageText.trim() || undefined,
        media: attachment ? { data: attachment.base64, mimeType: attachment.mimeType, filename: attachment.name } : undefined,
      } as any).unwrap();
      setMessageText("");
      setAttachment(null);
      if (textAreaRef.current) textAreaRef.current.style.height = "auto";
      await refetchChatList();
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setIsSending(false);
    }
  }, [activeChat?.id, messageText, attachment, isSending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleArchive = async (chatId: number) => {
    await updateStatus({ id: chatId, status: "diarsipkan" });
    setSelectedSenderId(null);
    refetchChatList();
  };

  // Start new chat session
  const handleStartChat = async (phoneNumber: string, name?: string) => {
    if (!selectedAkunId) return;
    const phone = phoneNumber.replace(/[^\d]/g, "");
    if (!phone) {
      alert("Masukkan nomor telepon yang valid.");
      return;
    }
    try {
      await buatChat({
        akun_id: selectedAkunId,
        nomor_telp: phone,
        nama: name || undefined,
      }).unwrap();
      
      setSelectedSenderId(`${phone}@c.us`);
      setShowNewChatModal(false);
      setNewChatNumber("");
      setNewChatSearchContact("");
      refetchChatList();
    } catch (err) {
      console.error("Gagal memulai chat baru:", err);
      alert("Gagal memulai chat baru.");
    }
  };

  // Save new contact WA
  const handleCreateContact = async () => {
    if (!selectedAkunId) return;
    if (!newContactForm.nama || !newContactForm.nomor_telp) {
      alert("Nama dan nomor telepon wajib diisi.");
      return;
    }
    try {
      const phone = newContactForm.nomor_telp.replace(/[^\d]/g, "");
      await buatKontak({
        akun_id: selectedAkunId,
        ...newContactForm,
        nomor_telp: phone,
      }).unwrap();

      // Automatically initiate chat with the newly saved contact JID
      await handleStartChat(phone, newContactForm.nama);

      // Reset form
      setNewContactForm({
        nama: "",
        nomor_telp: "",
        email: "",
        perusahaan: "",
        jabatan: "",
        catatan: "",
      });
      setShowNewContactModal(false);
      refetchKontak();
    } catch (err) {
      console.error("Gagal menyimpan kontak baru:", err);
      alert("Gagal menyimpan kontak baru.");
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (msgIdStr: string) => {
    const isReply = msgIdStr.startsWith("reply-");
    const dbId = Number(msgIdStr.replace(isReply ? "reply-" : "msg-", ""));
    if (isNaN(dbId)) return;

    if (confirm("Hapus pesan ini untuk semua orang?")) {
      try {
        await hapusPesan({ id: dbId, type: isReply ? "reply" : "parent" }).unwrap();
        refetchChatList();
      } catch (err) {
        console.error("Gagal menghapus pesan:", err);
        alert("Gagal menghapus pesan.");
      }
    }
  };

  // Clear chat handler
  const handleClearChat = async () => {
    if (!activeChat) return;
    if (confirm("Apakah Anda yakin ingin menghapus seluruh pesan di percakapan ini?")) {
      try {
        await clearChat(activeChat.id).unwrap();
        setSelectedSenderId(null);
        refetchChatList();
      } catch (err) {
        console.error("Gagal membersihkan percakapan:", err);
        alert("Gagal membersihkan percakapan.");
      }
    }
  };

  // ── Build UNIFIED timeline for any sender_id (group or individual) ──
  const buildSenderMessages = (chats: Chat[]): MessageItem[] => {
    const items: MessageItem[] = [];
    for (const chat of chats) {
      const isGrp = isGroup(chat.sender_id);
      
      // First incoming message (anchor message)
      if (chat.pesan) {
        items.push({
          id: `msg-${chat.id}`, type: "incoming",
          text: chat.pesan, time: formatMessageTime(chat.dibuat_pada),
          rawDate: chat.dibuat_pada, delivered: true,
          senderName: isGrp ? "Anggota" : undefined,
        });
      }
      
      // Balasan: distinguish incoming vs outgoing
      for (const b of (chat.balasan || [])) {
        const isIncoming = b.dikirim_oleh.startsWith("incoming:");
        const authorNum = isIncoming ? b.dikirim_oleh.replace("incoming:", "") : undefined;
        items.push({
          id: `reply-${b.id}`,
          type: isIncoming ? "incoming" : "outgoing",
          text: b.isi_balasan,
          time: formatMessageTime(b.dibuat_pada),
          rawDate: b.dibuat_pada,
          delivered: b.berhasil,
          senderName: isIncoming ? (authorNum || "Anggota") : undefined,
        });
      }
    }
    return items.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());
  };

  const messages: MessageItem[] = useMemo(() => {
    if (!selectedSenderId) return [];
    return buildSenderMessages(activeChatsForSender);
  }, [selectedSenderId, activeChatsForSender]);

  const grouped: { date: string; items: MessageItem[] }[] = [];
  messages.forEach((msg) => {
    const label = formatSectionDate(msg.rawDate);
    const last = grouped[grouped.length - 1];
    if (last?.date === label) last.items.push(msg);
    else grouped.push({ date: label, items: [msg] });
  });

  const activeChatIsGroup = isGroup(selectedSenderId);

  // Background pattern based on light/dark mode JID
  const chatWinBg: React.CSSProperties = isDark
    ? { background: t.msgBg, backgroundImage: "radial-gradient(circle, #1a2a32 1px, transparent 1px)", backgroundSize: "20px 20px" }
    : { background: t.msgBg, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23efeae2' width='400' height='400'/%3E%3Cg fill='none' stroke='%23d4c9b0' stroke-width='1' opacity='0.3'%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3Ccircle cx='150' cy='150' r='20'/%3E%3Ccircle cx='250' cy='50' r='25'/%3E%3Ccircle cx='350' cy='150' r='30'/%3E%3C/g%3E%3C/svg%3E\")" };

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <div
      className="flex h-full w-full overflow-hidden transition-all duration-300 relative font-sans"
      style={{ background: t.bg }}
    >
      {/* ═══════ LEFT — Chat List (iOS Style) ═══════ */}
      <div className="flex flex-col shrink-0 border-r select-none" style={{ width: 360, background: t.bg, borderColor: t.border }}>

        {/* iOS Large Title Header */}
        <div className="px-5 pt-6 pb-2 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: t.text }}>Chats</h1>
            <div className="flex items-center gap-3.5">
              {/* New Contact Icon */}
              <button
                onClick={() => setShowNewContactModal(true)}
                className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-blue-500 hover:scale-105"
                title="Kontak Baru"
              >
                <UserPlus className="w-[22px] h-[22px]" />
              </button>
              {/* New Chat (Edit Icon) */}
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-blue-500 hover:scale-105"
                title="Mulai Chat Baru"
              >
                <Edit className="w-[20px] h-[20px]" />
              </button>
            </div>
          </div>

          {/* SSE Status Mini Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium border"
            style={{
              background: sseStatus === "connected" ? "rgba(52,199,89,0.06)"
                : sseStatus === "connecting" ? "rgba(255,204,0,0.06)"
                : "rgba(255,59,48,0.06)",
              borderColor: sseStatus === "connected" ? "rgba(52,199,89,0.2)"
                : sseStatus === "connecting" ? "rgba(255,204,0,0.2)"
                : "rgba(255,59,48,0.2)",
              color: sseStatus === "connected" ? "#34c759" : sseStatus === "connecting" ? "#ffcc00" : "#ff3b30"
            }}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${sseStatus === "connecting" ? "animate-ping" : ""}`}
                style={{ background: sseStatus === "connected" ? "#34c759" : sseStatus === "connecting" ? "#ffcc00" : "#ff3b30" }} />
              <span>Status Koneksi: {sseStatus === "connected" ? "Aktif" : sseStatus === "connecting" ? "Menghubungkan..." : "Terputus"}</span>
            </div>
          </div>
        </div>

        {/* Multi-account selector (visible if multiple exist) */}
        {connectedAkun.length > 1 && (
          <div className="px-4 pb-2 shrink-0">
            <select
              value={selectedAkunId || ""}
              onChange={(e) => { setSelectedAkunId(Number(e.target.value)); setSelectedSenderId(null); }}
              className="w-full text-xs font-medium rounded-xl px-3 py-2.5 focus:outline-none transition-all cursor-pointer shadow-sm"
              style={{
                background: t.inputField,
                color: t.text,
                border: `1px solid ${t.border}`
              }}
            >
              {connectedAkun.map((a) => (
                <option key={a.id} value={a.id} style={{ background: isDark ? "#1c1c1e" : "#fff", color: t.text }}>
                  {a.nama_akun} ({a.username})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* iOS Search Bar */}
        <div className="px-4 py-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all" style={{ background: t.inputField }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: t.textMuted }} />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1 min-w-0"
              style={{ color: t.text }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                <X className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
              </button>
            )}
          </div>
        </div>

        {/* iOS Style Filter segmented pills */}
        <div className="px-4 py-1.5 shrink-0 flex gap-2 overflow-x-auto select-none no-scrollbar">
          {(["all", "unread", "groups"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-sm shrink-0 border"
              style={{
                background: activeFilter === filter ? t.accent : t.inputField,
                color: activeFilter === filter ? "#ffffff" : t.textMuted,
                borderColor: activeFilter === filter ? "transparent" : t.border
              }}
            >
              {filter === "all" ? "Semua" : filter === "unread" ? "Belum Dibaca" : "Grup"}
            </button>
          ))}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto mt-2">
          {!selectedAkunId ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <FaWhatsapp className="text-5xl mb-4 opacity-15" style={{ color: t.accent }} />
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Belum Ada Akun Terhubung</p>
            </div>
          ) : isLoadingChatList ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: t.accent }} />
            </div>
          ) : displayChatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <MessageSquareDashed className="w-11 h-11 mb-4 opacity-20" style={{ color: t.textMuted }} />
              <p className="text-sm font-semibold" style={{ color: t.textMuted }}>Tidak ada percakapan</p>
            </div>
          ) : (
            displayChatList.map((chat) => {
              const isGroupChat = isGroup(chat.sender_id);
              const isActive = chat.sender_id === selectedSenderId;

              const chatInfo = getLatestMessageInfo(chat.sender_id!);
              const previewText = chatInfo.text;

              const allChatsForSender = chatList.filter((c) => c.sender_id === chat.sender_id);
              const hasUnread = allChatsForSender.some((c) => !c.sudah_dibaca);
              const displayName = getSenderDisplayNama(chat.sender_id!, chat.sender_nama);

              return (
                <div
                  key={chat.sender_id}
                  onClick={() => {
                    setSelectedSenderId(chat.sender_id!);
                    setShowContactPanel(false);
                  }}
                  className="flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-colors border-b"
                  style={{
                    background: isActive ? t.rowActive : "transparent",
                    borderColor: t.border,
                  }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar name={displayName} size={50} isGroupChat={isGroupChat} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold truncate" style={{ color: t.text }}>{displayName}</span>
                        {isGroupChat && (
                          <Users className="w-3.5 h-3.5 shrink-0" style={{ color: t.textMuted }} />
                        )}
                      </div>
                      <span className="text-[11px] shrink-0 font-medium" style={{ color: hasUnread ? t.accent : t.textMuted }}>
                        {chatInfo.date ? formatChatTime(chatInfo.date) : formatChatTime(chat.diperbarui_pada || chat.dibuat_pada)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="text-xs truncate leading-snug flex-1 min-w-0" style={{ color: t.textMuted }}>
                        {chatInfo.isOutgoing && (
                          <CheckCheck className="inline w-3.5 h-3.5 mr-1 mb-0.5" style={{ color: "#34b7f1" }} />
                        )}
                        {previewText || <span className="italic">Tidak ada pesan</span>}
                      </p>
                      {hasUnread && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                          style={{ background: t.accent, color: "#fff" }}>1</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════ RIGHT — Chat Window (iOS Style) ═══════ */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {!hasSelection ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={chatWinBg}>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm border border-black/5"
              style={{ background: isDark ? "rgba(48,209,88,0.1)" : "rgba(52,199,89,0.1)" }}>
              <FaWhatsapp className="text-5xl" style={{ color: t.accent }} />
            </div>
            <h2 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: t.text }}>WhatsApp iOS</h2>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: t.textMuted }}>
              Pilih salah satu obrolan dari daftar untuk mulai mengirim pesan secara real-time.
            </p>
          </div>
        ) : (
          <>
            {/* ── Chat Header (Frosted Glass iOS Style) ── */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b relative z-30"
              style={{ background: t.header, borderColor: t.border, backdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-3.5 min-w-0">
                <button className="md:hidden mr-1 text-blue-500 hover:text-blue-600" onClick={() => { setSelectedSenderId(null); }}>
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <Avatar
                  name={selectedSenderId ? getSenderDisplayNama(selectedSenderId, activeChat?.sender_nama || "WhatsApp User") : "WhatsApp User"}
                  size={40}
                  isGroupChat={activeChatIsGroup}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-[15px] leading-tight truncate" style={{ color: t.text }}>
                      {selectedSenderId ? getSenderDisplayNama(selectedSenderId, activeChat?.sender_nama || "WhatsApp User") : "..."}
                    </h3>
                  </div>
                  <p className="text-xs truncate font-medium" style={{ color: t.textMuted }}>
                    {selectedSenderId
                      ? (activeChatIsGroup
                        ? `Grup · ${selectedSenderId.replace("@g.us","")}`
                        : `+${selectedSenderId.replace("@c.us","").replace("@g.us","")}`)
                      : ""
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Info kontak */}
                <button
                  onClick={() => setShowContactPanel((v) => !v)}
                  disabled={!activeChat}
                  className="p-2.5 rounded-full transition-all text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                  style={showContactPanel ? { background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" } : {}}
                  title="Info Kontak"
                >
                  <Info className="w-5.5 h-5.5" />
                </button>
                {/* Clear Chat */}
                <button
                  onClick={handleClearChat}
                  disabled={!activeChat}
                  className="p-2.5 rounded-full transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30"
                  title="Bersihkan Chat"
                >
                  <Trash2 className="w-5.5 h-5.5" />
                </button>
                {/* Arsipkan */}
                <button
                  onClick={() => activeChat && handleArchive(activeChat.id)}
                  disabled={!activeChat}
                  className="p-2.5 rounded-full transition-all text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                  title="Arsipkan"
                >
                  <Archive className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>

            {/* ── Messages Timeline ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={chatWinBg}>
              {grouped.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="text-[10px] px-3.5 py-1 rounded-full font-bold tracking-wider"
                      style={{ background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)", color: t.textMuted }}>
                      {group.date}
                    </span>
                  </div>

                  {group.items.map((msg, idx) => {
                    const prevItem = idx > 0 ? group.items[idx - 1] : null;
                    const showSenderLabel = msg.type === "incoming" && activeChatIsGroup && (
                      !prevItem || prevItem.type === "outgoing" || prevItem.senderName !== msg.senderName
                    );
                    const isFileMsg = msg.text.startsWith("[") && msg.text.endsWith("]");

                    return (
                      <div key={msg.id} className={`flex mb-2 ${msg.type === "outgoing" ? "justify-end" : "justify-start"}`}>
                        {/* Group incoming: avatar beside bubble */}
                        {msg.type === "incoming" && activeChatIsGroup && (
                          <div className="mr-2 mt-auto mb-1">
                            <Avatar name={msg.senderName || "G"} size={28} isGroupChat />
                          </div>
                        )}

                        {/* iOS Message Bubble Wrapper */}
                        <div
                          className="group relative transition-all"
                          style={{
                            background: msg.type === "outgoing" ? t.bubbleOut : t.bubbleIn,
                            color: t.text,
                            borderRadius: msg.type === "outgoing" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            padding: "8px 14px 7px",
                            maxWidth: "68%",
                            boxShadow: "0 1px 1.5px rgba(0,0,0,0.08)",
                          }}
                        >
                          {/* Group member label */}
                          {showSenderLabel && msg.senderName && (
                            <p className="text-[10px] font-bold mb-1"
                              style={{ color: getMemberColor(msg.senderName) }}>
                              ~{msg.senderName}
                            </p>
                          )}

                          {/* Message Delete Hover Button */}
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 rounded-full bg-white dark:bg-zinc-800 text-red-500 shadow-md border border-black/5 hover:scale-105 transition-all"
                              title="Hapus untuk Semua Orang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Message body */}
                          {isFileMsg ? (
                            <div className="flex items-center gap-3 pr-14 select-none">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${t.accent}20` }}>
                                <FileText className="w-5.5 h-5.5" style={{ color: t.accent }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate leading-tight">{msg.text.slice(1, -1)}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>Dokumen / Lampiran</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words pr-14 font-normal select-text">{msg.text}</p>
                          )}

                          {/* Timestamp + check status */}
                          <div className="absolute bottom-1 right-2.5 flex items-center gap-1 select-none">
                            <span className="text-[9px] font-medium" style={{ color: t.textMuted }}>{msg.time}</span>
                            {msg.type === "outgoing" && (
                              msg.delivered
                                ? <CheckCheck className="w-3.5 h-3.5" style={{ color: "#34b7f1" }} />
                                : <Check className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Attachment Preview ── */}
            {attachment && (
              <div className="mx-4 mb-3 rounded-2xl p-3.5 flex items-center gap-3.5 shrink-0 border shadow-sm"
                style={{ background: t.inputField, borderColor: t.border }}>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-black/5" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center border border-black/5" style={{ background: t.bg }}>
                    <FileText className="w-7 h-7" style={{ color: t.accent }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: t.text }}>{attachment.name}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: t.textMuted }}>{formatFileSize(attachment.size)}</p>
                </div>
                <button onClick={() => setAttachment(null)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Emoji Panel Integration ── */}
            {showEmoji && (
              <EmojiPanel theme={t} onSelect={(e) => { setMessageText((p) => p + e); }} onClose={() => setShowEmoji(false)} />
            )}

            {/* ── iOS-Style Bottom Input Bar ── */}
            <div className="flex items-end gap-2.5 px-4 py-3 shrink-0 border-t z-20"
              style={{ background: isDark ? "#161616" : "#f6f6f6", borderColor: t.border }}>
              
              {/* Plus Button Attachment */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!activeChat}
                className="p-2 rounded-full transition-all shrink-0 text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                title="Pilih File"
              >
                <Plus className="w-6 h-6" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={handleFileChange}
              />
              
              {/* Emoji Button */}
              <button
                onClick={() => setShowEmoji((v) => !v)}
                disabled={!activeChat}
                className="p-2 rounded-full transition-all shrink-0 text-blue-500 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
                style={{ color: showEmoji ? t.accent : undefined }}
              >
                <Smile className="w-6 h-6" />
              </button>
 
              {/* Text Area Input Container */}
              <div className="flex-1 rounded-2xl px-3.5 py-2 min-w-0 border shadow-inner transition-all duration-200" 
                style={{ 
                  background: isDark ? t.inputField : "#ffffff", 
                  borderColor: t.border,
                  opacity: activeChat ? 1 : 0.5
                }}>
                <textarea
                  ref={textAreaRef}
                  rows={1}
                  value={messageText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder={activeChat ? "Pesan" : "Menghubungkan..."}
                  disabled={!activeChat}
                  className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed"
                  style={{ color: t.text, maxHeight: 120, overflowY: "auto", scrollbarWidth: "none" }}
                />
              </div>
 
              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!activeChat || isSending || (!messageText.trim() && !attachment)}
                className="p-2.5 rounded-full transition-all shrink-0 flex items-center justify-center hover:scale-105 disabled:scale-100 disabled:opacity-50"
                style={{
                  background: (messageText.trim() || attachment) && activeChat ? t.accent : "transparent",
                  color: (messageText.trim() || attachment) && activeChat ? "#ffffff" : t.textMuted,
                  boxShadow: (messageText.trim() || attachment) && activeChat ? `0 2px 10px ${t.accent}40` : "none",
                }}
              >
                {isSending ? <Loader2 className="w-5.5 h-5.5 animate-spin" /> : <Send className="w-5.5 h-5.5" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ═══════ RIGHT SIDEBAR — Contact Info Panel (iOS Style) ═══════ */}
      {showContactPanel && hasSelection && activeChat && (
        <div className="flex flex-col shrink-0 border-l overflow-y-auto select-none" style={{ width: 320, background: t.bg, borderColor: t.border }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b shrink-0" style={{ background: t.header, borderColor: t.border }}>
            <span className="font-bold text-sm" style={{ color: t.text }}>{activeChatIsGroup ? "Info Grup" : "Detail Kontak"}</span>
            <button onClick={() => setShowContactPanel(false)} className="text-blue-500 hover:text-blue-600 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all">
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Big Profile Card */}
          <div className="flex flex-col items-center py-8 border-b shrink-0 text-center px-4" style={{ background: t.header, borderColor: t.border }}>
            <Avatar name={getSenderDisplayNama(activeChat.sender_id, activeChat.sender_nama)} size={80} isGroupChat={activeChatIsGroup} />
            <h3 className="font-bold text-[18px] mt-4 tracking-tight leading-snug" style={{ color: t.text }}>
              {getSenderDisplayNama(activeChat.sender_id, activeChat.sender_nama)}
            </h3>
            <p className="text-xs font-semibold mt-1" style={{ color: t.textMuted }}>
              {activeChatIsGroup
                ? `ID: ${activeChat.sender_id?.replace("@g.us","")}`
                : `+${activeChat.sender_id?.replace("@c.us","").replace("@g.us","")}`
              }
            </p>
            <span className="mt-3 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider"
              style={{
                background: activeChat.status === "baru" ? "rgba(0,122,255,0.1)"
                  : activeChat.status === "dijawab" ? "rgba(52,199,89,0.1)"
                  : "rgba(142,142,147,0.1)",
                color: activeChat.status === "baru" ? "#007aff"
                  : activeChat.status === "dijawab" ? "#34c759"
                  : t.textMuted,
              }}>
              {activeChat.status === "baru" ? "Baru" : activeChat.status === "dijawab" ? "Dijawab" : "Diarsipkan"}
            </span>
          </div>

          {/* Context forms / attributes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {!activeChatIsGroup && (
              <ContactPanelForm
                activeChat={activeChat}
                existingKontak={activeChatKontak}
                akunId={selectedAkunId!}
                theme={t}
                onSaved={refetchKontak}
                buatKontak={buatKontak}
                updateKontak={updateKontak}
              />
            )}

            {activeChatIsGroup && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: t.textMuted }}>ID GRUP</p>
                <div className="rounded-2xl px-4 py-3 border font-mono text-xs break-all" style={{ background: t.inputField, borderColor: t.border, color: t.text }}>
                  {activeChat.sender_id}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="border-t pt-4" style={{ borderColor: t.border }}>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-3.5" style={{ color: t.textMuted }}>Statistik Chat</p>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{ background: t.inputField, borderColor: t.border }}>
                  <p className="font-extrabold text-2xl" style={{ color: t.text }}>{activeChat.balasan?.length || 0}</p>
                  <p className="text-[10px] font-bold mt-1 uppercase" style={{ color: t.textMuted }}>BALASAN</p>
                </div>
                <div className="rounded-2xl p-3.5 text-center border shadow-sm" style={{ background: t.inputField, borderColor: t.border }}>
                  <p className="font-bold text-xs truncate" style={{ color: t.text }}>
                    {formatDistanceToNow(new Date(activeChat.dibuat_pada), { locale: localeId, addSuffix: false })}
                  </p>
                  <p className="text-[10px] font-bold mt-2.5 uppercase" style={{ color: t.textMuted }}>USIA CHAT</p>
                </div>
              </div>
            </div>

            {/* Danger Zone Actions */}
            <div className="border-t pt-4" style={{ borderColor: t.border }}>
              <button
                onClick={handleClearChat}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-bold border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all shadow-sm"
              >
                <Trash2 className="w-4.5 h-4.5" />
                <span>Bersihkan Riwayat Obrolan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NEW CHAT (iOS style list and custom input)
          ═══════════════════════════════════════════════════════ */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border"
            style={{ background: t.bg, borderColor: t.border }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ background: t.header, borderColor: t.border }}>
              <span className="font-bold text-base" style={{ color: t.text }}>Chat Baru</span>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Custom Phone Number Input */}
            <div className="p-5 border-b shrink-0 flex flex-col gap-3" style={{ background: t.header, borderColor: t.border }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>Hubungi Nomor Kustom</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: 628123456789"
                  value={newChatNumber}
                  onChange={(e) => setNewChatNumber(e.target.value)}
                  className="flex-1 text-sm rounded-xl px-4 py-2.5 outline-none border transition-all"
                  style={{ background: t.inputField, color: t.text, borderColor: t.border }}
                />
                <button
                  onClick={() => handleStartChat(newChatNumber)}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all"
                  style={{ background: t.accent, color: "#fff" }}
                >
                  Hubungi
                </button>
              </div>
            </div>

            {/* Saved Contacts Directory */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[10px] font-bold uppercase" style={{ color: t.textMuted }}>Daftar Kontak Tersimpan</span>
                <button
                  onClick={() => { setShowNewChatModal(false); setShowNewContactModal(true); }}
                  className="text-xs font-semibold text-blue-500 hover:underline"
                >
                  + Kontak Baru
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-2.5" style={{ background: t.inputField }}>
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari kontak..."
                  value={newChatSearchContact}
                  onChange={(e) => setNewChatSearchContact(e.target.value)}
                  className="bg-transparent text-xs outline-none flex-1"
                  style={{ color: t.text }}
                />
              </div>

              {filteredNewChatContacts.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: t.textMuted }}>Tidak ada kontak yang cocok</p>
              ) : (
                filteredNewChatContacts.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleStartChat(c.nomor_telp, c.nama)}
                    className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border hover:scale-[1.01]"
                    style={{ background: t.inputField, borderColor: t.border }}
                  >
                    <Avatar name={c.nama} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: t.text }}>{c.nama}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>+{c.nomor_telp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: NEW CONTACT (iOS style form)
          ═══════════════════════════════════════════════════════ */}
      {showNewContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border"
            style={{ background: t.bg, borderColor: t.border }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ background: t.header, borderColor: t.border }}>
              <span className="font-bold text-base" style={{ color: t.text }}>Simpan Kontak Baru</span>
              <button
                onClick={() => setShowNewContactModal(false)}
                className="p-1 rounded-full text-blue-500 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[
                { label: "Nama Lengkap *", key: "nama", type: "text", placeholder: "Contoh: Budi Santoso" },
                { label: "Nomor WhatsApp (dengan Kode Negara) *", key: "nomor_telp", type: "text", placeholder: "Contoh: 628123456789" },
                { label: "Email", key: "email", type: "email", placeholder: "Contoh: budi@gmail.com" },
                { label: "Perusahaan", key: "perusahaan", type: "text", placeholder: "Contoh: PT. Maju Jaya" },
                { label: "Jabatan", key: "jabatan", type: "text", placeholder: "Contoh: Staff Marketing" },
                { label: "Catatan Pribadi", key: "catatan", type: "textarea", placeholder: "Ketik catatan tambahan di sini..." },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold uppercase block mb-1.5" style={{ color: t.textMuted }}>{label}</label>
                  {type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={(newContactForm as any)[key]}
                      onChange={(e) => setNewContactForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full text-sm rounded-xl px-4 py-2.5 outline-none border transition-all resize-none"
                      style={{ background: t.inputField, color: t.text, borderColor: t.border }}
                    />
                  ) : (
                    <input
                      type={type}
                      value={(newContactForm as any)[key]}
                      onChange={(e) => setNewContactForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full text-sm rounded-xl px-4 py-2.5 outline-none border transition-all"
                      style={{ background: t.inputField, color: t.text, borderColor: t.border }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div className="p-5 border-t shrink-0 flex gap-3" style={{ background: t.header, borderColor: t.border }}>
              <button
                onClick={() => setShowNewContactModal(false)}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-sm text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{ borderColor: t.border }}
              >
                Batal
              </button>
              <button
                onClick={handleCreateContact}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all hover:opacity-90"
                style={{ background: t.accent }}
              >
                Simpan & Hubungi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CONTACT PANEL FORM
// ═══════════════════════════════════════════════════════

interface ContactPanelFormProps {
  activeChat: Chat; existingKontak: KontakWA | null;
  akunId: number; theme: WaTheme; onSaved: () => void;
  buatKontak: any; updateKontak: any;
}

function ContactPanelForm({ activeChat, existingKontak, akunId, theme: t, onSaved, buatKontak, updateKontak }: ContactPanelFormProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nama: existingKontak?.nama || activeChat.sender_nama,
    email: existingKontak?.email || "",
    perusahaan: existingKontak?.perusahaan || "",
    jabatan: existingKontak?.jabatan || "",
    grup: existingKontak?.grup || "",
    catatan: existingKontak?.catatan || "",
  });

  useEffect(() => {
    if (existingKontak) {
      setForm({ nama: existingKontak.nama, email: existingKontak.email || "", perusahaan: existingKontak.perusahaan || "", jabatan: existingKontak.jabatan || "", grup: existingKontak.grup || "", catatan: existingKontak.catatan || "" });
    } else {
      setForm({
        nama: activeChat.sender_nama,
        email: "",
        perusahaan: "",
        jabatan: "",
        grup: "",
        catatan: "",
      });
    }
  }, [existingKontak?.id, activeChat.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const phone = activeChat.sender_id?.replace("@c.us", "").replace("@g.us", "");
      if (existingKontak) await updateKontak({ id: existingKontak.id, ...form }).unwrap();
      else await buatKontak({ akun_id: akunId, nomor_telp: phone, ...form }).unwrap();
      setEditing(false);
      onSaved();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const inputClass = "text-sm rounded-xl px-4 py-2.5 w-full outline-none transition-all border";
  const fields = [
    { label: "Nama", key: "nama" }, { label: "Email", key: "email" },
    { label: "Perusahaan", key: "perusahaan" }, { label: "Jabatan", key: "jabatan" }, { label: "Grup", key: "grup" },
  ] as const;

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
          {existingKontak ? "KONTAK TERSIMPAN" : "SIMPAN KONTAK"}
        </p>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-xs font-bold text-blue-500 hover:underline">
            {existingKontak ? "Edit" : "+ Simpan"}
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="text-xs font-medium text-zinc-400 hover:underline">Batal</button>
            <button onClick={handleSave} disabled={saving} className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}Simpan
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3.5">
          {fields.map(({ label, key }) => (
            <div key={key}>
              <label className="text-[10px] block mb-1.5 font-bold uppercase text-zinc-400">{label}</label>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={inputClass}
                style={{ background: t.inputField, color: t.text, borderColor: t.border }}
                placeholder={label}
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] block mb-1.5 font-bold uppercase text-zinc-400">Catatan</label>
            <textarea
              rows={3}
              value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
              className={`${inputClass} resize-none`}
              style={{ background: t.inputField, color: t.text, borderColor: t.border }}
              placeholder="Catatan pribadi..."
            />
          </div>
        </div>
      ) : existingKontak ? (
        <div className="space-y-2.5">
          {[
            { label: "Email", value: existingKontak.email },
            { label: "Perusahaan", value: existingKontak.perusahaan },
            { label: "Jabatan", value: existingKontak.jabatan },
            { label: "Grup", value: existingKontak.grup },
            { label: "Catatan", value: existingKontak.catatan },
          ].filter((f) => f.value).map(({ label, value }) => (
            <div key={label} className="rounded-2xl px-4 py-3 border shadow-sm" style={{ background: t.inputField, borderColor: t.border }}>
              <p className="text-[10px] font-bold uppercase text-zinc-400">{label}</p>
              <p className="text-sm mt-1 font-medium" style={{ color: t.text }}>{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-zinc-400">
          Kontak ini belum tersimpan. Klik "+ Simpan" untuk menyimpan data kontak ke database.
        </p>
      )}
    </div>
  );
}
