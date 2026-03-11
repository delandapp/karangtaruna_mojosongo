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
};

// Global cache TTL in seconds (1 Hour by default)
export const DEFAULT_CACHE_TTL = 3600;
