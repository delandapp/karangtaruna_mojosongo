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
};

export const S3_BUCKETS = {
  E_PROPOSAL: "assets-proposal-sponsorship-karang-taruna",
  COVER_E_PROPOSAL: "assets-cover-sponsorship-karang-taruna",
  SOUND_E_PROPOSAL: "assets-music-sponsorship-karang-taruna",
};

// Global cache TTL in seconds (1 Hour by default)
export const DEFAULT_CACHE_TTL = 3600;
