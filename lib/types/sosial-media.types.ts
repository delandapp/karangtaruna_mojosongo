// ─── Sosial Media Types ──────────────────────────────────────────────────────
// TypeScript interfaces untuk fitur Dashboard Sosial Media

// ─── Platform ────────────────────────────────────────────────────────────────
export interface Platform {
  id: number;
  nama: string;
  slug: string;
  ikon_url: string | null;
  aktif: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
}

// ─── Akun Sosial Media ───────────────────────────────────────────────────────
export type StatusAkun = "terhubung" | "terputus" | "expired";

export interface AkunSosmed {
  id: number;
  platform_id: number;
  nama_akun: string;
  username: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: StatusAkun;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  platform?: Platform;
}

export interface HubungkanAkunPayload {
  platform_id: number;
  nama_akun: string;
  username: string;
  access_token: string;
  session_id?: string;
  refresh_token?: string;
  token_expires_at?: string;
}

export interface PerbaruiTokenPayload {
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
}

// ─── Konten ──────────────────────────────────────────────────────────────────
export type TipeKonten = "post" | "story" | "reels" | "tweet";
export type StatusKonten = "draft" | "scheduled" | "published" | "failed";

export interface MediaKonten {
  id: number;
  konten_id: number;
  url: string;
  tipe_media: "image" | "video" | "document";
  urutan: number;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
}

export interface JadwalKonten {
  id: number;
  konten_id: number;
  waktu_posting: string;
  status_job: "pending" | "running" | "done" | "failed";
  pesan_error: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
}

export interface KontenPlatform {
  id: number;
  konten_id: number;
  platform_id: number;
  external_post_id: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  platform?: Platform;
}

export interface Konten {
  id: number;
  akun_id: number;
  judul: string | null;
  caption: string | null;
  tipe_konten: TipeKonten;
  status: StatusKonten;
  dijadwalkan_pada: string | null;
  diposting_pada: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  akun?: AkunSosmed;
  media?: MediaKonten[];
  jadwal?: JadwalKonten[];
  platform?: KontenPlatform[];
}

export interface BuatKontenPayload {
  akun_id: number;
  tipe_konten: TipeKonten;
  caption: string;
  platform_ids: number[];
  jadwal?: string;
  media_urls?: string[];
}

export interface UpdateKontenPayload extends Partial<BuatKontenPayload> {
  id: number;
}

export interface KontenFilter {
  akun_id?: number;
  platform_id?: number;
  status?: StatusKonten;
  tipe_konten?: TipeKonten;
  search?: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────
export type StatusChat = "baru" | "dijawab" | "diarsipkan";

export interface BalasanChat {
  id: number;
  chat_id: number;
  isi_balasan: string;
  dikirim_oleh: string;
  berhasil: boolean;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
}

export interface Chat {
  id: number;
  akun_id: number;
  sender_id: string;
  sender_nama: string;
  pesan: string;
  sudah_dibaca: boolean;
  status: StatusChat;
  platform_msg_id: string | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  akun?: AkunSosmed;
  balasan?: BalasanChat[];
}

export interface BalasChatPayload {
  chat_id: number;
  isi_balasan: string;
}

export interface ChatFilter {
  akun_id?: number;
  platform_id?: number;
  status?: StatusChat;
  search?: string;
}

// ─── Analitik ────────────────────────────────────────────────────────────────
export interface Analitik {
  id: number;
  akun_id: number;
  tanggal: string;
  followers: number;
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  komentar: number;
  share: number;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  akun?: AkunSosmed;
}

export interface AnalitikFilter {
  akun_id?: number;
  platform_id?: number;
  periode?: "7d" | "30d" | "custom";
  tanggal_mulai?: string;
  tanggal_selesai?: string;
}

export interface AnalitikSummary {
  total_followers: number;
  total_reach: number;
  total_impressions: number;
  engagement_rate: number;
}

export interface TopKontenItem {
  id: number;
  judul: string | null;
  caption: string | null;
  tipe_konten: TipeKonten;
  likes: number;
  komentar: number;
  share: number;
  total_engagement: number;
  diposting_pada: string | null;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    total: number;
    per_platform: Record<string, number>;
  };
}
