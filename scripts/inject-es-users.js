const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/users/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Search Logic
// Replace:
//     if (search) {
//       where.OR = [
//         { nama_lengkap: { contains: search, mode: "insensitive" } },
//         { username: { contains: search, mode: "insensitive" } },
//       ];
//     }
// With ES Fetch

const searchRegex = /if\s*\(\s*search\s*\)\s*\{\s*where\.OR\s*=\s*\[[\s\S]*?\];\s*\}/g;

const esReplacement = `if (search) {
      const { hits } = await searchDocuments(
        ELASTIC_INDICES.USERS,
        {
          multi_match: {
            query: search,
            fields: ["nama_lengkap", "username"],
          },
        },
        { size: 5000 } // Ambil cukup banyak id untuk difilter oleh Prisma Security
      );
      
      const ids = hits.map((h: any) => parseInt(h.id, 10)).filter((id: number) => !isNaN(id));
      
      if (ids.length === 0) {
        return paginatedResponse([], { total: 0, page, limit, totalPages: 0 });
      }
      where.id = { in: ids };
    }`;

content = content.replace(searchRegex, esReplacement);

// 3. Prevent caching on search queries
// Replace:
//     // Try hitting cache first
//     const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);
//     if (cachedData) {
// With:
//     // Try hitting cache first (Hanya jika tidak ada search)
//     const cachedData = !search ? await getCache<{ data: any[]; meta: any }>(cacheKey) : null;
//     if (cachedData) {

content = content.replace(
  'const cachedData = await getCache<{ data: any[]; meta: any }>(cacheKey);',
  'const cachedData = !search ? await getCache<{ data: any[]; meta: any }>(cacheKey) : null;'
);

// Prevent set cache
//     await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL);
// With:
//     if (!search) await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL);

content = content.replace(
  'await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL);',
  'if (!search) { await setCache(cacheKey, { data: users, meta }, DEFAULT_CACHE_TTL); }'
);


fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in users/route.ts");
