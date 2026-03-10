import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

interface KategoriBrandJson {
  company_categories: {
    id: number;
    category: string;
    description: string;
  }[];
}

export async function seedKategoriBrand(prisma: PrismaClient) {
  console.log("Seeding Kategori Brand...");

  const filePath = path.join(
    process.cwd(),
    "documentation",
    "data_json",
    "kategori_brand.json",
  );

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping seedKategoriBrand.`);
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData) as KategoriBrandJson;

  let count = 0;
  for (const item of data.company_categories) {
    if (!item.category) continue;

    await prisma.m_kategori_brand.upsert({
      where: { nama_kategori: item.category },
      update: {},
      create: {
        nama_kategori: item.category,
        deskripsi_kategori: item.description || null,
      },
    });
    count++;
  }

  console.log(`✅ Berhasil seed ${count} kategori brand dari JSON`);
}
