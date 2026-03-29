const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/jabatans/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Prisma Logic
const targetRegex = /\/\/ 3\. Bangun Query Prisma[\s\S]*?prisma\.m_jabatan\.count\(\{ where: whereCondition \}\),\n    \]\);/g;

const replacement = `// 3. Bangun Query Prisma & Elasticsearch
    let jabatans: any[] = [];
    let total = 0;

    if (searchQuery) {
      const { hits, total: totalHits } = await searchDocuments(
        ELASTIC_INDICES.JABATANS,
        {
          multi_match: {
            query: searchQuery,
            fields: ["nama_jabatan", "deskripsi_jabatan"],
          },
        },
        { from: skip, size: limit }
      );
      total = totalHits;
      const ids = hits.map((hit: any) => parseInt(hit.id, 10)).filter((id: number) => !isNaN(id));
      if (ids.length > 0) {
        jabatans = await prisma.m_jabatan.findMany({ where: { id: { in: ids } } });
        jabatans.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      }
    } else {
      const data = await Promise.all([
        prisma.m_jabatan.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.m_jabatan.count()
      ]);
      jabatans = data[0];
      total = data[1];
    }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in jabatans/route.ts");
