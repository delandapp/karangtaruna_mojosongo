/**
 * ============================================================
 * News Domain — Event Types & Direct Helpers
 * (Kafka telah dihapus — semua operasi dilakukan langsung)
 * ============================================================
 */

// ─── Payload Types (masih digunakan oleh consumer files) ─────────────────────

export interface NewsPublishedPayload {
  id: number;
  judul: string;
  konten_plaintext: string;
  seo_slug: string;
  seo_description: string | null;
  seo_keywords: string[];
  kategori: string;
  kategori_slug: string;
  tags: string[];
  published_at: Date | null;
  total_views: number;
  total_likes: number;
  trending_score: number;
  cover_url: string | null;
}

export interface NewsViewedPayload {
  berita_id: number;
  timestamp: number;
}

// ─── Stub producers (Kafka dihapus — fungsi ini adalah no-op) ────────────────

/**
 * Stub: produceNewsPublished
 * Sebelumnya memproduce event ke Kafka. Sekarang menjadi no-op.
 * Indexing ke Elasticsearch dilakukan langsung dari API route.
 */
export async function produceNewsPublished(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: NewsPublishedPayload,
): Promise<void> {
  // No-op: Kafka telah dihapus dari project ini.
  // ES indexing dilakukan langsung di API route berita.
}

/**
 * Stub: produceNewsViewed
 * Sebelumnya memproduce event ke Kafka. Sekarang menjadi no-op.
 * View counting dilakukan langsung via bufferView() di view-counter.consumer.ts.
 */
export async function produceNewsViewed(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _beritaId: number,
): Promise<void> {
  // No-op: Kafka telah dihapus dari project ini.
}

/**
 * Stub: disconnectNewsProducer
 */
export async function disconnectNewsProducer(): Promise<void> {
  // No-op
}
