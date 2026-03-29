const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../app/api/levels/route.ts');
let content = fs.readFileSync(targetFilePath, 'utf-8');

const targetRegex = /\/\/ 3\. Bangun Query Prisma[\s\S]*?prisma\.m_level\.count\(\{ where: whereCondition \}\),\n    \]\);/g;

const replacement = `// 3. Bangun Query Prisma & Elasticsearch
    let levels: any[] = [];
    let total = 0;

    if (searchQuery) {
      const { hits, total: totalHits } = await searchDocuments(
        ELASTIC_INDICES.LEVELS,
        {
          multi_match: {
            query: searchQuery,
            fields: ["nama_level"],
          },
        },
        { from: skip, size: limit }
      );
      total = totalHits;
      const ids = hits.map((hit: any) => parseInt(hit.id, 10)).filter((id: number) => !isNaN(id));
      if (ids.length > 0) {
        levels = await prisma.m_level.findMany({ where: { id: { in: ids } } });
        levels.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      }
    } else {
      const data = await Promise.all([
        prisma.m_level.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
        prisma.m_level.count()
      ]);
      levels = data[0];
      total = data[1];
    }`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync(targetFilePath, content);
console.log("Successfully replaced ES logic in levels/route.ts");
