export const REDIS_KEYS = {
  // Master Data Cache Keys
  LEVELS: {
    ALL: "master:levels:all", // Used for pagination cache like "master:levels:all:page:1:limit:10"
    ALL_PREFIX: "master:levels:all:*", // To invalidate all paginated keys
    SINGLE: (id: number) => `master:levels:${id}`,
  },
  JABATANS: {
    ALL: "master:jabatans:all", // Used for pagination cache like "master:jabatans:all:page:1:limit:10"
    ALL_PREFIX: "master:jabatans:all:*", // To invalidate all paginated keys
    SINGLE: (id: number) => `master:jabatans:${id}`,
  },
  USERS: {
    ALL: "master:users:all",
    ALL_PREFIX: "master:users:all:*",
    SINGLE: (id: number) => `master:users:${id}`,
  },
  HAK_AKSES: {
    ALL: "master:hak_akses:all",
    ALL_PREFIX: "master:hak_akses:all:*",
    SINGLE: (id: number) => `master:hak_akses:${id}`,
  },
  ORGANISASI: {
    ALL: "master:organisasi:all",
    ALL_PREFIX: "master:organisasi:all:*",
    SINGLE: (id: number) => `master:organisasi:${id}`,
  },
  EVENTS: {
    ALL: "master:events:all",
    ALL_PREFIX: "master:events:all:*",
    SINGLE: (id: number) => `master:events:${id}`,
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
    ALL: "master:rapat:all",
    ALL_PREFIX: "master:rapat:all:*",
    SINGLE: (id: number) => `master:rapat:${id}`,
  },
  SEKTOR_INDUSTRI: {
    ALL: "master:sektor_industri:all",
    ALL_PREFIX: "master:sektor_industri:all:*",
    SINGLE: (id: number) => `master:sektor_industri:${id}`,
  },
  SKALA_PERUSAHAAN: {
    ALL: "master:skala_perusahaan:all",
    ALL_PREFIX: "master:skala_perusahaan:all:*",
    SINGLE: (id: number) => `master:skala_perusahaan:${id}`,
  },
  PERUSAHAAN: {
    ALL: "master:perusahaan:all",
    ALL_PREFIX: "master:perusahaan:all:*",
    SINGLE: (id: number) => `master:perusahaan:${id}`,
  },
  E_PROPOSAL: {
    ALL: (eventId: number) => `event:${eventId}:eproposal:all`,
    ALL_PREFIX: (eventId: number) => `event:${eventId}:eproposal:all:*`,
    SINGLE: (eventId: number, id: number) => `event:${eventId}:eproposal:${id}`,
    SINGLE_BY_SLUG: (slug: string) => `eproposal:slug:${slug}`,
  },
  PROVINSI: {
    ALL: "master:wilayah:provinsi:all",
    ALL_PREFIX: "master:wilayah:provinsi:all:*",
    SINGLE: (id: number) => `master:wilayah:provinsi:${id}`,
  },
  KOTA: {
    ALL: "master:wilayah:kota:all",
    ALL_PREFIX: "master:wilayah:kota:all:*",
    SINGLE: (id: number) => `master:wilayah:kota:${id}`,
  },
  KECAMATAN: {
    ALL: "master:wilayah:kecamatan:all",
    ALL_PREFIX: "master:wilayah:kecamatan:all:*",
    SINGLE: (id: number) => `master:wilayah:kecamatan:${id}`,
  },
  KELURAHAN: {
    ALL: "master:wilayah:kelurahan:all",
    ALL_PREFIX: "master:wilayah:kelurahan:all:*",
    SINGLE: (id: number) => `master:wilayah:kelurahan:${id}`,
  },
};

export const S3_BUCKETS = {
  E_PROPOSAL: "assets-proposal-sponsorship-karang-taruna",
  COVER_E_PROPOSAL: "assets-cover-sponsorship-karang-taruna",
  SOUND_E_PROPOSAL: "assets-music-sponsorship-karang-taruna",
};

// Global cache TTL in seconds (1 Hour by default)
export const DEFAULT_CACHE_TTL = 3600;
