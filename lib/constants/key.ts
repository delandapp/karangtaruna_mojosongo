export const REDIS_KEYS = {
  // Master Data Cache Keys
  LEVELS: {
    ALL: "karangtaruna_master:levels:all", // Used for pagination cache like "karangtaruna_master:levels:all:page:1:limit:10"
    ALL_PREFIX: "karangtaruna_master:levels:all:*", // To invalidate all paginated keys
    SINGLE: (id: number) => `karangtaruna_master:levels:${id}`,
  },
  JABATANS: {
    ALL: "karangtaruna_master:jabatans:all", // Used for pagination cache like "karangtaruna_master:jabatans:all:page:1:limit:10"
    ALL_PREFIX: "karangtaruna_master:jabatans:all:*", // To invalidate all paginated keys
    SINGLE: (id: number) => `karangtaruna_master:jabatans:${id}`,
  },
  USERS: {
    ALL: "karangtaruna_master:users:all",
    ALL_PREFIX: "karangtaruna_master:users:all:*",
    SINGLE: (id: number) => `karangtaruna_master:users:${id}`,
  },
  HAK_AKSES: {
    ALL: "karangtaruna_master:hak_akses:all",
    ALL_PREFIX: "karangtaruna_master:hak_akses:all:*",
    SINGLE: (id: number) => `karangtaruna_master:hak_akses:${id}`,
  },
  ORGANISASI: {
    ALL: "karangtaruna_master:organisasi:all",
    ALL_PREFIX: "karangtaruna_master:organisasi:all:*",
    SINGLE: (id: number) => `karangtaruna_master:organisasi:${id}`,
  },
  EVENTS: {
    ALL: "karangtaruna_master:events:all",
    ALL_PREFIX: "karangtaruna_master:events:all:*",
    SINGLE: (id: number) => `karangtaruna_master:events:${id}`,
  },
  PANITIA: {
    ALL: (eventId: number) => `event:${eventId}:panitia:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:panitia:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:panitia:${id}`,
  },
  RUNDOWN: {
    ALL: (eventId: number) => `event:${eventId}:rundown:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:rundown:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:rundown:${id}`,
  },
  TUGAS: {
    ALL: (eventId: number) => `event:${eventId}:tugas:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:tugas:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:tugas:${id}`,
  },
  ANGGARAN: {
    ALL: (eventId: number) => `event:${eventId}:anggaran:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:anggaran:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:anggaran:${id}`,
  },
  RAPAT: {
    ALL: "karangtaruna_master:rapat:all",
    ALL_PREFIX: "karangtaruna_master:rapat:all:*",
    SINGLE: (id: number) => `karangtaruna_master:rapat:${id}`,
  },
  SEKTOR_INDUSTRI: {
    ALL: "karangtaruna_master:sektor_industri:all",
    ALL_PREFIX: "karangtaruna_master:sektor_industri:all:*",
    SINGLE: (id: number) => `karangtaruna_master:sektor_industri:${id}`,
  },
  SKALA_PERUSAHAAN: {
    ALL: "karangtaruna_master:skala_perusahaan:all",
    ALL_PREFIX: "karangtaruna_master:skala_perusahaan:all:*",
    SINGLE: (id: number) => `karangtaruna_master:skala_perusahaan:${id}`,
  },
  PERUSAHAAN: {
    ALL: "karangtaruna_master:perusahaan:all",
    ALL_PREFIX: "karangtaruna_master:perusahaan:all:*",
    SINGLE: (id: number) => `karangtaruna_master:perusahaan:${id}`,
  },
  E_PROPOSAL: {
    ALL: (eventId: number) => `event:${eventId}:eproposal:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:eproposal:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:eproposal:${id}`,
    SINGLE_BY_SLUG: (slug: string) => `eproposal:slug:${slug}`,
  },
  PROVINSI: {
    ALL: "karangtaruna_master:wilayah:provinsi:all",
    ALL_PREFIX: "karangtaruna_master:wilayah:provinsi:all:*",
    SINGLE: (id: number) => `karangtaruna_master:wilayah:provinsi:${id}`,
  },
  KOTA: {
    ALL: "karangtaruna_master:wilayah:kota:all",
    ALL_PREFIX: "karangtaruna_master:wilayah:kota:all:*",
    SINGLE: (id: number) => `karangtaruna_master:wilayah:kota:${id}`,
  },
  KECAMATAN: {
    ALL: "karangtaruna_master:wilayah:kecamatan:all",
    ALL_PREFIX: "karangtaruna_master:wilayah:kecamatan:all:*",
    SINGLE: (id: number) => `karangtaruna_master:wilayah:kecamatan:${id}`,
  },
  KELURAHAN: {
    ALL: "karangtaruna_master:wilayah:kelurahan:all",
    ALL_PREFIX: "karangtaruna_master:wilayah:kelurahan:all:*",
    SINGLE: (id: number) => `karangtaruna_master:wilayah:kelurahan:${id}`,
  },

  // ── Berita (News Portal) ──────────────────────────────────────────────
  BERITA: {
    ALL: "karangtaruna_news:berita:all",
    ALL_PREFIX: "karangtaruna_news:berita:all:*",
    SINGLE: (id: number) => `karangtaruna_news:berita:${id}`,
    SINGLE_BY_SLUG: (slug: string) => `karangtaruna_news:berita:slug:${slug}`,
    TRENDING: "karangtaruna_news:berita:trending",
    TOP: "karangtaruna_news:berita:top",
    LATEST: (page: number) => `karangtaruna_news:berita:latest:page:${page}`,
    BY_KATEGORI: (slug: string, page: number) =>
      `karangtaruna_news:berita:kategori:${slug}:page:${page}`,
    VIEW_CERT: (jti: string, beritaId: number) =>
      `karangtaruna_news:view:${jti}:${beritaId}`,
  },
  KATEGORI_BERITA: {
    ALL: "karangtaruna_news:kategori:all",
    ALL_PREFIX: "karangtaruna_news:kategori:all:*",
    SINGLE: (id: number) => `karangtaruna_news:kategori:${id}`,
    SINGLE_BY_SLUG: (slug: string) => `karangtaruna_news:kategori:slug:${slug}`,
  },
  TAG_BERITA: {
    ALL: "karangtaruna_news:tag:all",
    ALL_PREFIX: "karangtaruna_news:tag:all:*",
    SINGLE: (id: number) => `karangtaruna_news:tag:${id}`,
  },
};

export const S3_BUCKETS = {
  E_PROPOSAL: "assets-proposal-sponsorship-karang-taruna",
  COVER_E_PROPOSAL: "assets-cover-sponsorship-karang-taruna",
  SOUND_E_PROPOSAL: "assets-music-sponsorship-karang-taruna",
};

// Global cache TTL in seconds (1 Hour by default)
export const DEFAULT_CACHE_TTL = 3600;

// ============================================================================
// Debezium Configuration
// ============================================================================
export const DEBEZIUM_CONFIG = {
  SERVER_NAME: "dbserver1",
  SCHEMA: "public",
  /** Generates a Debezium topic name: {server}.{schema}.{table} */
  topicName: (table: string) => `dbserver1.public.${table}`,
};

// ============================================================================
// Kafka Topics (Debezium CDC)
// Format: {server}.{schema}.{table} → dbserver1.public.{table}
// ============================================================================
export const KAFKA_TOPICS = {
  // ── User & Access Management ──────────────────────────────────────────
  USERS_CDC: "dbserver1.public.m_user",
  LEVELS_CDC: "dbserver1.public.m_level",
  JABATANS_CDC: "dbserver1.public.m_jabatan",
  HAK_AKSES_CDC: "dbserver1.public.m_hak_akses",
  HAK_AKSES_RULE_CDC: "dbserver1.public.m_hak_akses_rule",

  // ── Organisasi ────────────────────────────────────────────────────────
  ORGANISASI_CDC: "dbserver1.public.m_organisasi",

  // ── Event Management ─────────────────────────────────────────────────
  EVENTS_CDC: "dbserver1.public.event",
  PANITIA_CDC: "dbserver1.public.anggota_panitia",
  RUNDOWN_CDC: "dbserver1.public.rundown_acara",
  TUGAS_CDC: "dbserver1.public.tugas_event",
  RAPAT_CDC: "dbserver1.public.rapat",

  // ── Keuangan ──────────────────────────────────────────────────────────
  ANGGARAN_CDC: "dbserver1.public.anggaran",
  ITEM_ANGGARAN_CDC: "dbserver1.public.item_anggaran",
  TRANSAKSI_KEUANGAN_CDC: "dbserver1.public.transaksi_keuangan",

  // ── Wilayah ───────────────────────────────────────────────────────────
  PROVINSI_CDC: "dbserver1.public.m_provinsi",
  KOTA_CDC: "dbserver1.public.m_kota",
  KECAMATAN_CDC: "dbserver1.public.m_kecamatan",
  KELURAHAN_CDC: "dbserver1.public.m_kelurahan",

  // ── Sponsorship & Perusahaan ──────────────────────────────────────────
  KATEGORI_BRAND_CDC: "dbserver1.public.m_kategori_brand",
  BIDANG_BRAND_CDC: "dbserver1.public.m_bidang_brand",
  BRAND_CDC: "dbserver1.public.m_brand",
  SKALA_PERUSAHAAN_CDC: "dbserver1.public.m_skala_perusahaan",
  SEKTOR_INDUSTRI_CDC: "dbserver1.public.m_sektor_industri",
  PERUSAHAAN_CDC: "dbserver1.public.m_perusahaan",
  KATEGORI_SPONSOR_CDC: "dbserver1.public.m_kategori_sponsor",
  SPONSOR_CDC: "dbserver1.public.m_sponsor",
  EVENT_SPONSOR_CDC: "dbserver1.public.event_sponsor",
  PROPOSAL_SPONSOR_CDC: "dbserver1.public.proposal_sponsor",

  // ── Logistik ──────────────────────────────────────────────────────────
  VENDOR_CDC: "dbserver1.public.m_vendor",
  VENUE_CDC: "dbserver1.public.m_venue",
  INVENTARIS_CDC: "dbserver1.public.m_inventaris",
  EVENT_VENDOR_CDC: "dbserver1.public.event_vendor",
  EVENT_VENUE_CDC: "dbserver1.public.event_venue",

  // ── Pendaftaran ───────────────────────────────────────────────────────
  KATEGORI_PENDAFTARAN_CDC: "dbserver1.public.kategori_pendaftaran",
  PENDAFTARAN_CDC: "dbserver1.public.pendaftaran",
  HASIL_LOMBA_CDC: "dbserver1.public.hasil_lomba",

  // ── Promosi ───────────────────────────────────────────────────────────
  KATEGORI_BERITA_CDC: "dbserver1.public.m_kategori_berita",
  BERITA_CDC: "dbserver1.public.c_berita",
  KALENDER_KONTEN_CDC: "dbserver1.public.kalender_konten",

  // ── Sistem ────────────────────────────────────────────────────────────
  NOTIFIKASI_CDC: "dbserver1.public.notifikasi",
  LOG_AUDIT_CDC: "dbserver1.public.log_audit",

  // ── Feedback ──────────────────────────────────────────────────────────
  SURVEI_KEPUASAN_CDC: "dbserver1.public.survei_kepuasan",
  RESPON_SURVEI_CDC: "dbserver1.public.respon_survei",
  SARAN_MASUKAN_CDC: "dbserver1.public.saran_masukan",

  // ── Tiket ─────────────────────────────────────────────────────────────
  JENIS_TIKET_CDC: "dbserver1.public.jenis_tiket",
  TIKET_ORDER_CDC: "dbserver1.public.tiket_order",
  TIKET_TERBIT_CDC: "dbserver1.public.tiket_terbit",

  // ── Dokumen & Surat ───────────────────────────────────────────────────
  JENIS_SURAT_CDC: "dbserver1.public.m_jenis_surat",
  SURAT_CDC: "dbserver1.public.surat",
  DOKUMEN_CDC: "dbserver1.public.dokumen",
  LAPORAN_CDC: "dbserver1.public.laporan",

  // ── Dokumentasi ───────────────────────────────────────────────────────
  MEDIA_GALERI_CDC: "dbserver1.public.media_galeri",

  // ── Sekolah ───────────────────────────────────────────────────────────
  SEKOLAH_CDC: "dbserver1.public.m_sekolah",
  SEKOLAH_DETAIL_CDC: "dbserver1.public.m_sekolah_detail",
  SEKOLAH_FOTO_CDC: "dbserver1.public.m_sekolah_foto",

  // ── Jenjang ───────────────────────────────────────────────────────────
  JENJANG_CDC: "dbserver1.public.m_jenjang",

  // ── E-Proposal ────────────────────────────────────────────────────────
  EPROPOSAL_CDC: "dbserver1.public.m_eproposal",
  EPROPOSAL_PENGATURAN_CDC: "dbserver1.public.c_eproposal_pengaturan",
  EPROPOSAL_DAFTAR_ISI_CDC: "dbserver1.public.c_eproposal_daftar_isi",

  // ── Cache Operations (non-CDC) ────────────────────────────────────────
  CACHE_SET: "karangtaruna.cache.set",
  CACHE_INVALIDATE: "karangtaruna.cache.invalidate",

  // ── Berita — Custom Domain Events (non-CDC) ───────────────────────────
  NEWS_PUBLISHED: "karangtaruna.news.published",
  NEWS_VIEWED: "karangtaruna.news.viewed",
};

// ============================================================================
// Elasticsearch Indices
// Format: karangtaruna_{table}_index
// ============================================================================
export const ELASTIC_INDICES = {
  // ── User & Access Management ──────────────────────────────────────────
  USERS: "karangtaruna_m_user_index",
  LEVELS: "karangtaruna_m_level_index",
  JABATANS: "karangtaruna_m_jabatan_index",
  HAK_AKSES: "karangtaruna_m_hak_akses_index",
  HAK_AKSES_RULE: "karangtaruna_m_hak_akses_rule_index",

  // ── Organisasi ────────────────────────────────────────────────────────
  ORGANISASI: "karangtaruna_m_organisasi_index",

  // ── Event Management ─────────────────────────────────────────────────
  EVENTS: "karangtaruna_event_index",
  PANITIA: "karangtaruna_anggota_panitia_index",
  RUNDOWN: "karangtaruna_rundown_acara_index",
  TUGAS: "karangtaruna_tugas_event_index",
  RAPAT: "karangtaruna_rapat_index",

  // ── Keuangan ──────────────────────────────────────────────────────────
  ANGGARAN: "karangtaruna_anggaran_index",
  ITEM_ANGGARAN: "karangtaruna_item_anggaran_index",
  TRANSAKSI_KEUANGAN: "karangtaruna_transaksi_keuangan_index",

  // ── Wilayah ───────────────────────────────────────────────────────────
  PROVINSI: "karangtaruna_m_provinsi_index",
  KOTA: "karangtaruna_m_kota_index",
  KECAMATAN: "karangtaruna_m_kecamatan_index",
  KELURAHAN: "karangtaruna_m_kelurahan_index",

  // ── Sponsorship & Perusahaan ──────────────────────────────────────────
  KATEGORI_BRAND: "karangtaruna_m_kategori_brand_index",
  BIDANG_BRAND: "karangtaruna_m_bidang_brand_index",
  BRAND: "karangtaruna_m_brand_index",
  SKALA_PERUSAHAAN: "karangtaruna_m_skala_perusahaan_index",
  SEKTOR_INDUSTRI: "karangtaruna_m_sektor_industri_index",
  PERUSAHAAN: "karangtaruna_m_perusahaan_index",
  KATEGORI_SPONSOR: "karangtaruna_m_kategori_sponsor_index",
  SPONSOR: "karangtaruna_m_sponsor_index",
  EVENT_SPONSOR: "karangtaruna_event_sponsor_index",
  PROPOSAL_SPONSOR: "karangtaruna_proposal_sponsor_index",

  // ── Logistik ──────────────────────────────────────────────────────────
  VENDOR: "karangtaruna_m_vendor_index",
  VENUE: "karangtaruna_m_venue_index",
  INVENTARIS: "karangtaruna_m_inventaris_index",
  EVENT_VENDOR: "karangtaruna_event_vendor_index",
  EVENT_VENUE: "karangtaruna_event_venue_index",

  // ── Pendaftaran ───────────────────────────────────────────────────────
  KATEGORI_PENDAFTARAN: "karangtaruna_kategori_pendaftaran_index",
  PENDAFTARAN: "karangtaruna_pendaftaran_index",
  HASIL_LOMBA: "karangtaruna_hasil_lomba_index",

  // ── Promosi ───────────────────────────────────────────────────────────
  KATEGORI_BERITA: "karangtaruna_m_kategori_berita_index",
  BERITA: "karangtaruna_berita_index",
  KALENDER_KONTEN: "karangtaruna_kalender_konten_index",

  // ── Sistem ────────────────────────────────────────────────────────────
  NOTIFIKASI: "karangtaruna_notifikasi_index",
  LOG_AUDIT: "karangtaruna_log_audit_index",

  // ── Feedback ──────────────────────────────────────────────────────────
  SURVEI_KEPUASAN: "karangtaruna_survei_kepuasan_index",
  RESPON_SURVEI: "karangtaruna_respon_survei_index",
  SARAN_MASUKAN: "karangtaruna_saran_masukan_index",

  // ── Tiket ─────────────────────────────────────────────────────────────
  JENIS_TIKET: "karangtaruna_jenis_tiket_index",
  TIKET_ORDER: "karangtaruna_tiket_order_index",
  TIKET_TERBIT: "karangtaruna_tiket_terbit_index",

  // ── Dokumen & Surat ───────────────────────────────────────────────────
  JENIS_SURAT: "karangtaruna_m_jenis_surat_index",
  SURAT: "karangtaruna_surat_index",
  DOKUMEN: "karangtaruna_dokumen_index",
  LAPORAN: "karangtaruna_laporan_index",

  // ── Dokumentasi ───────────────────────────────────────────────────────
  MEDIA_GALERI: "karangtaruna_media_galeri_index",

  // ── Sekolah ───────────────────────────────────────────────────────────
  SEKOLAH: "karangtaruna_m_sekolah_index",
  SEKOLAH_DETAIL: "karangtaruna_m_sekolah_detail_index",
  SEKOLAH_FOTO: "karangtaruna_m_sekolah_foto_index",

  // ── Jenjang ───────────────────────────────────────────────────────────
  JENJANG: "karangtaruna_m_jenjang_index",

  // ── E-Proposal ────────────────────────────────────────────────────────
  EPROPOSAL: "karangtaruna_m_eproposal_index",
  EPROPOSAL_PENGATURAN: "karangtaruna_c_eproposal_pengaturan_index",
  EPROPOSAL_DAFTAR_ISI: "karangtaruna_c_eproposal_daftar_isi_index",
};

/** All Elasticsearch index names for bulk operations */
export const ALL_ELASTIC_INDICES: string[] = Object.values(ELASTIC_INDICES);
