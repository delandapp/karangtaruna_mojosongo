// ============================================================================
// Elasticsearch DISABLED — All operations are no-ops.
// Search and listing now uses Prisma + Redis directly.
// ============================================================================

/** @deprecated No-op: ES removed, use Prisma + Redis instead */
export async function checkElasticHealth(): Promise<boolean> {
  return true;
}

/** @deprecated No-op: ES removed */
export async function ensureIndex(
  _indexName: string,
  _mappings?: Record<string, unknown>,
): Promise<void> {}

/** @deprecated No-op: ES removed */
export async function indexDocument<T extends Record<string, unknown>>(
  _indexName: string,
  _id: string | number,
  _document: T,
): Promise<void> {}

/** @deprecated No-op: ES removed */
export async function deleteDocument(
  _indexName: string,
  _id: string | number,
): Promise<void> {}

/** @deprecated No-op: ES removed. Returns empty result. Callers should use Prisma directly. */
export async function searchDocuments<T = unknown>(
  _indexName: string,
  _query: Record<string, unknown>,
  _options: {
    from?: number;
    size?: number;
    sort?: Record<string, unknown>[];
    _source?: string[];
  } = {},
): Promise<{ hits: T[]; total: number }> {
  return { hits: [], total: 0 };
}

/** @deprecated No-op: ES removed */
export async function bulkIndex<T extends Record<string, unknown>>(
  _indexName: string,
  _documents: Array<{ id: string | number; doc: T }>,
): Promise<void> {}

/** @deprecated No-op: ES removed. Returns null. */
export async function getDocument<T = Record<string, unknown>>(
  _indexName: string,
  _id: string | number,
): Promise<(T & { id: string }) | null> {
  return null;
}

/** @deprecated No-op: ES removed */
export async function deleteAllDocuments(_indexName: string): Promise<void> {}
