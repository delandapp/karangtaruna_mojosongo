const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/events/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Prisma Logic
const targetRegex = /    \/\/ 3\. Bangun query Prisma[\s\S]*?prisma\.event\.count\(\{ where: whereCondition \}\),\n    \]\);/g;

const replacement = `    // 3. Bangun query Prisma & Elasticsearch
    let events: any[] = [];
    let total = 0;

    if (searchQuery) {
      const { hits, total: totalHits } = await searchDocuments(
        ELASTIC_INDICES.EVENTS,
        {
          multi_match: {
            query: searchQuery,
            fields: ["nama_event", "kode_event", "lokasi"],
          },
        },
        { size: 5000 } // Get enough IDs to apply Prisma filters
      );
      
      const ids = hits.map((h: any) => parseInt(h.id, 10)).filter((id: number) => !isNaN(id));
      if (ids.length > 0) {
        whereCondition.id = { in: ids };
      } else {
        // If ES found nothing, force empty list by passing impossible ID array (Prisma trick)
        whereCondition.id = { in: [-1] };
      }
    }

    const [eventsResult, totalResult] = await Promise.all([
      prisma.event.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
        include: {
          organisasi: { select: { id: true, nama_org: true } },
          dibuat_oleh: {
            select: { id: true, nama_lengkap: true, username: true },
          },
        },
      }),
      prisma.event.count({ where: whereCondition }),
    ]);
    
    events = eventsResult;
    total = totalResult;`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in events/route.ts");
