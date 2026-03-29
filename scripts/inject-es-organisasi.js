const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/organisasi/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Prisma Logic
const targetRegex = /\/\/ 3\. Bangun query Prisma[\s\S]*?prisma\.m_organisasi\.count\(\{ where: whereCondition \}\),\n    \]\);/g;

const replacement = `// 3. Bangun query Prisma & Elasticsearch
    let organisasiList: any[] = [];
    let total = 0;

    if (searchQuery) {
      const { hits, total: totalHits } = await searchDocuments(
        ELASTIC_INDICES.ORGANISASI,
        {
          multi_match: {
            query: searchQuery,
            fields: ["nama_org", "alamat", "email"],
          },
        },
        { from: skip, size: limit }
      );
      total = totalHits;
      const ids = hits.map((hit: any) => parseInt(hit.id, 10)).filter((id: number) => !isNaN(id));
      
      if (ids.length > 0) {
        organisasiList = await prisma.m_organisasi.findMany({
          where: { id: { in: ids } },
          include: {
            m_provinsi: true,
            m_kota: true,
            m_kecamatan: true,
            m_kelurahan: true,
          },
        });
        organisasiList.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      }
    } else {
      const data = await Promise.all([
        prisma.m_organisasi.findMany({
          skip,
          take: limit,
          orderBy: { dibuat_pada: "desc" },
          include: {
            m_provinsi: true,
            m_kota: true,
            m_kecamatan: true,
            m_kelurahan: true,
          },
        }),
        prisma.m_organisasi.count()
      ]);
      organisasiList = data[0];
      total = data[1];
    }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in organisasi/route.ts");
