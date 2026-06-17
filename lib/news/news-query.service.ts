/**
 * News Query Service — Aggregation queries untuk portal berita publik.
 *
 * Semua query menggunakan pola:
 *   Redis cache → miss → PostgreSQL (Prisma) → simpan ke Redis → return
 *
 * TTL Strategy:
 *   Trending   = 15 menit  (diupdate worker 15 menit sekali)
 *   Top        = 1 jam     (berubah perlahan)
 *   Terbaru p1 = 2 menit   (halaman 1 sering berubah)
 *   Terbaru p2+= 5 menit   (halaman 2+ jarang berubah)
 *   By Slug    = 10 menit  (stale setelah diedit)
 *   By Kategori= 5 menit   (medium frequency)
 */
import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { REDIS_KEYS } from "@/lib/constants";
import { subDays } from "date-fns";

// ─── TTL Constants (dalam detik) ─────────────────────────────────────────────

const TTL = {
  TRENDING:       15 * 60,
  TOP:            60 * 60,
  LATEST_P1:       2 * 60,
  LATEST_P2PLUS:   5 * 60,
  BY_SLUG:        10 * 60,
  BY_KATEGORI:     5 * 60,
} as const;

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface BeritaCard {
  id: number;
  judul: string;
  cover_url: string | null;
  kategori: string;
  kategori_slug: string;
  tags: string[];
  published_at: string | null;
  total_views: number;
  total_likes: number;
  trending_score: number;
  is_featured: boolean;
  seo_slug: string;
  // Tambahan field opsional untuk detail berita / es compat
  konten?: string;
  seo_description?: string | null;
  keywords?: string[];
  is_breaking_news?: boolean;
  penulis?: string;
  sub_judul?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapToBeritaCard(b: any): BeritaCard {
  const cover = b.c_berita_cover?.find((c: any) => c.is_primary) || b.c_berita_cover?.[0];
  const tags = b.r_berita_tag?.map((rt: any) => rt.m_tag?.nama).filter(Boolean) || [];
  return {
    id: b.id,
    judul: b.judul,
    cover_url: cover?.s3_url || null,
    kategori: b.m_kategori_berita?.nama || "",
    kategori_slug: b.m_kategori_berita?.slug || "",
    tags,
    published_at: b.published_at ? b.published_at.toISOString() : null,
    total_views: Number(b.total_views),
    total_likes: b.total_likes,
    trending_score: b.trending_score,
    is_featured: b.is_featured,
    seo_slug: b.seo_slug,
  };
}

// ─── Query Functions ──────────────────────────────────────────────────────────

/**
 * Berita Trending — 7 hari terakhir, sort by trending_score DESC.
 * Cache Redis: 15 menit.
 */
export async function getBeritaTrending(limit = 10): Promise<BeritaCard[]> {
  const cached = await getCache<BeritaCard[]>(REDIS_KEYS.BERITA.TRENDING);
  if (cached) return cached;

  const docs = await prisma.c_berita.findMany({
    where: {
      status: "PUBLISHED",
      published_at: { gte: subDays(new Date(), 7) },
      dihapus_pada: null,
    },
    orderBy: { trending_score: "desc" },
    take: limit,
    include: {
      m_kategori_berita: true,
      r_berita_tag: { include: { m_tag: true } },
      c_berita_cover: { where: { is_primary: true } },
    },
  });

  const hits = docs.map(mapToBeritaCard);
  await setCache(REDIS_KEYS.BERITA.TRENDING, hits, TTL.TRENDING);
  return hits;
}

/**
 * Berita Top — 30 hari terakhir, sort by total_views DESC.
 * Cache Redis: 1 jam.
 */
export async function getBeritaTop(limit = 10): Promise<BeritaCard[]> {
  const cached = await getCache<BeritaCard[]>(REDIS_KEYS.BERITA.TOP);
  if (cached) return cached;

  const docs = await prisma.c_berita.findMany({
    where: {
      status: "PUBLISHED",
      published_at: { gte: subDays(new Date(), 30) },
      dihapus_pada: null,
    },
    orderBy: { total_views: "desc" },
    take: limit,
    include: {
      m_kategori_berita: true,
      r_berita_tag: { include: { m_tag: true } },
      c_berita_cover: { where: { is_primary: true } },
    },
  });

  const hits = docs.map(mapToBeritaCard);
  await setCache(REDIS_KEYS.BERITA.TOP, hits, TTL.TOP);
  return hits;
}

/**
 * Berita Terbaru — sort by published_at DESC, paginated.
 * Cache Redis: hal.1 = 2 menit, hal.2+ = 5 menit.
 */
export async function getBeritaTerbaru(
  page = 1,
  limit = 20,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const cacheKey = REDIS_KEYS.BERITA.LATEST(page);
  const cached = await getCache<{ hits: BeritaCard[]; total: number }>(cacheKey);
  if (cached) return cached;

  const where = { status: "PUBLISHED" as const, status_berita: undefined, dihapus_pada: null };
  const [docs, total] = await Promise.all([
    prisma.c_berita.findMany({
      where: {
        status: "PUBLISHED",
        dihapus_pada: null,
      },
      orderBy: { published_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        m_kategori_berita: true,
        r_berita_tag: { include: { m_tag: true } },
        c_berita_cover: { where: { is_primary: true } },
      },
    }),
    prisma.c_berita.count({
      where: {
        status: "PUBLISHED",
        dihapus_pada: null,
      },
    }),
  ]);

  const hits = docs.map(mapToBeritaCard);
  const data = { hits, total };
  const ttl = page === 1 ? TTL.LATEST_P1 : TTL.LATEST_P2PLUS;
  await setCache(cacheKey, data, ttl);
  return data;
}

/**
 * Berita by SEO Slug — untuk halaman detail artikel publik.
 * Cache Redis: 10 menit.
 */
export async function getBeritaBySlug(
  slug: string,
): Promise<BeritaCard | null> {
  const cacheKey = REDIS_KEYS.BERITA.SINGLE_BY_SLUG(slug);
  const cached = await getCache<BeritaCard>(cacheKey);
  if (cached) return cached;

  const b = await prisma.c_berita.findFirst({
    where: { seo_slug: slug, status: "PUBLISHED", dihapus_pada: null },
    include: {
      m_kategori_berita: true,
      r_berita_tag: { include: { m_tag: true } },
      c_berita_cover: { where: { is_primary: true } },
    },
  });

  if (!b) return null;

  const cover = b.c_berita_cover?.find((c) => c.is_primary) || b.c_berita_cover?.[0];
  const tags = b.r_berita_tag?.map((rt) => rt.m_tag?.nama).filter(Boolean) || [];

  const doc: BeritaCard = {
    id: b.id,
    judul: b.judul,
    konten: b.konten_html, // NewsEsDocument.konten maps to konten_html
    seo_description: b.seo_description,
    keywords: b.seo_keywords,
    kategori: b.m_kategori_berita?.nama || "",
    kategori_slug: b.m_kategori_berita?.slug || "",
    tags,
    published_at: b.published_at ? b.published_at.toISOString() : null,
    total_views: Number(b.total_views),
    total_likes: b.total_likes,
    trending_score: b.trending_score,
    cover_url: cover?.s3_url || null,
    is_featured: b.is_featured,
    is_breaking_news: b.is_breaking_news,
    seo_slug: b.seo_slug,
    penulis: b.penulis,
    sub_judul: b.sub_judul,
  };

  await setCache(cacheKey, doc, TTL.BY_SLUG);
  return doc;
}

/**
 * Berita by Kategori Slug — paginated.
 * Cache Redis: 5 menit.
 */
export async function getBeritaByKategori(
  kategoriSlug: string,
  page = 1,
  limit = 20,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const cacheKey = REDIS_KEYS.BERITA.BY_KATEGORI(kategoriSlug, page);
  const cached = await getCache<{ hits: BeritaCard[]; total: number }>(cacheKey);
  if (cached) return cached;

  const where = {
    status: "PUBLISHED" as const,
    dihapus_pada: null,
    m_kategori_berita: { slug: kategoriSlug },
  };

  const [docs, total] = await Promise.all([
    prisma.c_berita.findMany({
      where,
      orderBy: { published_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        m_kategori_berita: true,
        r_berita_tag: { include: { m_tag: true } },
        c_berita_cover: { where: { is_primary: true } },
      },
    }),
    prisma.c_berita.count({ where }),
  ]);

  const hits = docs.map(mapToBeritaCard);
  const data = { hits, total };
  await setCache(cacheKey, data, TTL.BY_KATEGORI);
  return data;
}

/**
 * Full-text search berita — tanpa cache (hasil terlalu dinamis).
 */
export async function searchBerita(
  query: string,
  page = 1,
  limit = 20,
  kategoriSlug?: string,
): Promise<{ hits: BeritaCard[]; total: number }> {
  const where: any = {
    status: "PUBLISHED",
    dihapus_pada: null,
    OR: [
      { judul: { contains: query, mode: "insensitive" } },
      { sub_judul: { contains: query, mode: "insensitive" } },
      { konten_plaintext: { contains: query, mode: "insensitive" } },
    ],
  };

  if (kategoriSlug) {
    where.m_kategori_berita = { slug: kategoriSlug };
  }

  const [docs, total] = await Promise.all([
    prisma.c_berita.findMany({
      where,
      orderBy: { published_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        m_kategori_berita: true,
        r_berita_tag: { include: { m_tag: true } },
        c_berita_cover: { where: { is_primary: true } },
      },
    }),
    prisma.c_berita.count({ where }),
  ]);

  const hits = docs.map(mapToBeritaCard);
  return { hits, total };
}
