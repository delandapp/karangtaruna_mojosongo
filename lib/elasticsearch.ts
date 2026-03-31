import { Client } from "@elastic/elasticsearch";

// ============================================================================
// Elasticsearch Client Singleton
// Pattern sama seperti redis.ts — singleton di development, fresh di production
// ============================================================================

const globalForElastic = globalThis as unknown as {
  elasticClient: Client | undefined;
};

const elasticNode = process.env.ELASTIC_NODE || "http://localhost:9200";

export const elasticClient =
  globalForElastic.elasticClient ??
  new Client({
    node: elasticNode,
    // Optional: tambahkan auth jika Elasticsearch di-secure
    ...(process.env.ELASTIC_USERNAME && process.env.ELASTIC_PASSWORD
      ? {
          auth: {
            username: process.env.ELASTIC_USERNAME,
            password: process.env.ELASTIC_PASSWORD,
          },
        }
      : {}),
    // Retry configuration
    maxRetries: 3,
    requestTimeout: 30000,
    sniffOnStart: false,
  });

if (process.env.NODE_ENV !== "production")
  globalForElastic.elasticClient = elasticClient;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check apakah Elasticsearch cluster sehat
 */
export async function checkElasticHealth(): Promise<boolean> {
  try {
    const health = await elasticClient.cluster.health();
    return health.status !== "red";
  } catch (error) {
    console.error("[ELASTIC_HEALTH_ERROR]", error);
    return false;
  }
}

/**
 * Pastikan index ada, jika belum buat dengan settings default
 */
export async function ensureIndex(
  indexName: string,
  mappings?: Record<string, unknown>,
): Promise<void> {
  try {
    const exists = await elasticClient.indices.exists({ index: indexName });
    if (!exists) {
      await elasticClient.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                // Analyzer khusus untuk Bahasa Indonesia / general search
                default: {
                  type: "standard",
                },
                search_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "trim"],
                },
              },
            },
          },
          ...(mappings ? { mappings } : {}),
        },
      });
      console.log(`[ELASTIC] Index "${indexName}" created successfully`);
    }
  } catch (error) {
    console.error(`[ELASTIC_ENSURE_INDEX_ERROR] index: ${indexName}`, error);
  }
}

/**
 * Helper to serialize BigInts to Number to avoid Elasticsearch serialization errors
 */
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === "bigint" ? Number(value) : value,
    ),
  );
}

/**
 * Index (upsert) satu dokumen ke Elasticsearch
 */
export async function indexDocument<T extends Record<string, unknown>>(
  indexName: string,
  id: string | number,
  document: T,
): Promise<void> {
  try {
    const safeDocument = serializeBigInt(document);

    await elasticClient.index({
      index: indexName,
      id: String(id),
      body: safeDocument,
      refresh: "wait_for", // Langsung searchable setelah index
    });
  } catch (error) {
    console.error(
      `[ELASTIC_INDEX_ERROR] index: ${indexName}, id: ${id}`,
      error,
    );
  }
}

/**
 * Delete satu dokumen dari Elasticsearch
 */
export async function deleteDocument(
  indexName: string,
  id: string | number,
): Promise<void> {
  try {
    await elasticClient.delete({
      index: indexName,
      id: String(id),
      refresh: "wait_for",
    });
  } catch (error: any) {
    // Ignore 404 (document not found) — idempotent delete
    if (error?.meta?.statusCode === 404) return;
    console.error(
      `[ELASTIC_DELETE_ERROR] index: ${indexName}, id: ${id}`,
      error,
    );
  }
}

/**
 * Search dokumen dari Elasticsearch dengan query DSL
 */
export async function searchDocuments<T = unknown>(
  indexName: string,
  query: Record<string, unknown>,
  options: {
    from?: number;
    size?: number;
    sort?: Record<string, unknown>[];
    _source?: string[];
  } = {},
): Promise<{ hits: T[]; total: number }> {
  try {
    const { from = 0, size = 10, sort, _source } = options;

    // Tambahkan unmapped_type ke setiap sort field agar tidak error
    // saat index kosong atau field belum di-mapping
    const safeSortFields = sort?.map((sortItem) => {
      const entries = Object.entries(sortItem);
      const safeEntries = entries.map(([field, value]) => {
        if (typeof value === "object" && value !== null && !("unmapped_type" in value)) {
          return [field, { ...value, unmapped_type: "date" }];
        }
        return [field, value];
      });
      return Object.fromEntries(safeEntries);
    });

    const response = await elasticClient.search({
      index: indexName,
      body: {
        query,
        from,
        size,
        ...(safeSortFields ? { sort: safeSortFields } : {}),
        ...(_source ? { _source } : {}),
      },
    });

    const total =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value ?? 0;

    const hits = response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    })) as T[];

    return { hits, total };
  } catch (error) {
    console.error(`[ELASTIC_SEARCH_ERROR] index: ${indexName}`, error);
    return { hits: [], total: 0 };
  }
}

/**
 * Bulk index multiple dokumen sekaligus (untuk initial sync / reindex)
 */
export async function bulkIndex<T extends Record<string, unknown>>(
  indexName: string,
  documents: Array<{ id: string | number; doc: T }>,
): Promise<void> {
  if (documents.length === 0) return;

  try {
    const safeDocuments = serializeBigInt(documents);

    const body = safeDocuments.flatMap(({ id, doc }) => [
      { index: { _index: indexName, _id: String(id) } },
      doc,
    ]);

    const response = await elasticClient.bulk({ body, refresh: "wait_for" });

    if (response.errors) {
      const errorItems = response.items.filter(
        (item: any) => item.index?.error,
      );
      console.error(
        `[ELASTIC_BULK_ERROR] ${errorItems.length} errors in bulk index to "${indexName}"`,
        errorItems.slice(0, 3), // Log first 3 errors only
      );
    }
  } catch (error) {
    console.error(`[ELASTIC_BULK_INDEX_ERROR] index: ${indexName}`, error);
  }
}

/**
 * Get satu dokumen dari Elasticsearch by ID
 */
export async function getDocument<T = Record<string, unknown>>(
  indexName: string,
  id: string | number,
): Promise<(T & { id: string }) | null> {
  try {
    const response = await elasticClient.get({
      index: indexName,
      id: String(id),
    });

    return {
      id: response._id,
      ...(response._source as T),
    };
  } catch (error: any) {
    if (error?.meta?.statusCode === 404) return null;
    console.error(
      `[ELASTIC_GET_ERROR] index: ${indexName}, id: ${id}`,
      error,
    );
    return null;
  }
}

/**
 * Delete all documents from an index (untuk reindex / seeder)
 */
export async function deleteAllDocuments(indexName: string): Promise<void> {
  try {
    await elasticClient.deleteByQuery({
      index: indexName,
      body: {
        query: { match_all: {} },
      },
      refresh: true,
    });
  } catch (error: any) {
    if (error?.meta?.statusCode === 404) return; // Index doesn't exist
    console.error(
      `[ELASTIC_DELETE_ALL_ERROR] index: ${indexName}`,
      error,
    );
  }
}
