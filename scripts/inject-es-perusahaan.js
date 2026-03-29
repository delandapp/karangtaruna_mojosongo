const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/perusahaan/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Prisma Logic
const targetRegex = /    \/\/ 4\. Eksekusi query[\s\S]*?prisma\.m_perusahaan\.count\(\{ where: whereCondition \}\),\n    \]\);/g;

const replacement = `    // 4. Eksekusi query & Elasticsearch
    let items: any[] = [];
    let total = 0;

    if (searchQuery) {
      const { hits, total: totalHits } = await searchDocuments(
        ELASTIC_INDICES.PERUSAHAAN,
        {
          multi_match: {
            query: searchQuery,
            fields: ["nama", "nama_kontak"],
          },
        },
        { size: 5000 }
      );
      
      const ids = hits.map((h: any) => parseInt(h.id, 10)).filter((id: number) => !isNaN(id));
      if (ids.length > 0) {
        whereCondition.id = { in: ids };
      } else {
        whereCondition.id = { in: [-1] };
      }
    }

    const [itemsResult, totalResult] = await Promise.all([
      prisma.m_perusahaan.findMany({
        where: whereCondition,
        include: {
            sektor: true,
            skala: true,
            m_provinsi: true,
            m_kota: true,
            m_kecamatan: true,
            m_kelurahan: true,
        },
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
      }),
      prisma.m_perusahaan.count({ where: whereCondition }),
    ]);
    
    items = itemsResult;
    total = totalResult;`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in perusahaan/route.ts");
