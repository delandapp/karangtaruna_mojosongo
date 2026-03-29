const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/hak-akses/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

// 1. Add Imports
if (!content.includes('ELASTIC_INDICES')) {
  content = content.replace(
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";',
    'import { REDIS_KEYS, DEFAULT_CACHE_TTL, ELASTIC_INDICES } from "@/lib/constants";\nimport { searchDocuments } from "@/lib/elasticsearch";'
  );
}

// 2. Replace Prisma Logic
const targetRegex = /const whereCondition = searchQuery[\s\S]*?prisma\.m_hak_akses\.count\(\{ where: whereCondition \}\),\n        \]\);/g;

const replacement = `let hakAkses: any[] = [];
        let total = 0;

        if (searchQuery) {
            const { hits, total: totalHits } = await searchDocuments(
                ELASTIC_INDICES.HAK_AKSES,
                {
                    multi_match: {
                        query: searchQuery,
                        fields: ["nama_fitur", "endpoint"],
                    },
                },
                { from: skip, size: limit }
            );
            total = totalHits;
            const ids = hits.map((hit: any) => parseInt(hit.id, 10)).filter((id: number) => !isNaN(id));
            
            if (ids.length > 0) {
                hakAkses = await prisma.m_hak_akses.findMany({
                    where: { id: { in: ids } },
                    include: {
                        rules: {
                            include: {
                                level: { select: { nama_level: true } },
                                jabatan: { select: { nama_jabatan: true } },
                            }
                        }
                    }
                });
                hakAkses.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            }
        } else {
            const data = await Promise.all([
                prisma.m_hak_akses.findMany({
                    skip,
                    take: limit,
                    orderBy: [{ endpoint: "asc" }, { method: "asc" }],
                    include: {
                        rules: {
                            include: {
                                level: { select: { nama_level: true } },
                                jabatan: { select: { nama_jabatan: true } },
                            }
                        }
                    }
                }),
                prisma.m_hak_akses.count()
            ]);
            hakAkses = data[0];
            total = data[1];
        }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in hak-akses/route.ts");
