// ─── Shortlink Types ─────────────────────────────────────────────────────────
// TypeScript interfaces untuk fitur Dashboard Shortlink (URL Shortener)

// ─── Entity ──────────────────────────────────────────────────────────────────

export interface Shortlink {
  id: number;
  judul: string;
  slug: string;
  url_tujuan: string;
  deskripsi: string | null;
  is_aktif: boolean;
  kedaluwarsa_pada: string | null;
  total_klik: number;
  dibuat_oleh_id: number | null;
  dibuat_pada: string;
  diperbarui_pada: string;
  dihapus_pada: string | null;
  // Includes
  dibuat_oleh?: {
    id: number;
    nama: string;
  } | null;
}

export interface ShortlinkClick {
  id: number;
  shortlink_id: number;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
  dibuat_pada: string;
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface CreateShortlinkPayload {
  judul: string;
  url_tujuan: string;
  slug?: string;
  deskripsi?: string;
  is_aktif?: boolean;
  kedaluwarsa_pada?: string;
}

export interface UpdateShortlinkPayload extends Partial<CreateShortlinkPayload> {
  id: number;
}

// ─── Query Params ────────────────────────────────────────────────────────────

export interface ShortlinkListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_aktif?: boolean;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface ShortlinkListResponse {
  success: boolean;
  data: Shortlink[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ShortlinkResponse {
  success: boolean;
  data: Shortlink;
}

export interface ShortlinkClickStats {
  total_klik: number;
  klik_hari_ini: number;
  klik_7_hari: number;
  klik_30_hari: number;
  klik_per_hari: {
    tanggal: string;
    total: number;
  }[];
}

export interface ShortlinkStatsResponse {
  success: boolean;
  data: ShortlinkClickStats;
}
