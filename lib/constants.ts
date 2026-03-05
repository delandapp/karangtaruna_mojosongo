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
};

// Global cache TTL in seconds (1 Hour by default)
export const DEFAULT_CACHE_TTL = 3600;
