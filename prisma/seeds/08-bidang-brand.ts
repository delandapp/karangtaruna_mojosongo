import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

interface BidangBrandJson {
  sponsorship_categories: {
    id: number;
    category: string;
    description: string;
  }[];
}

export async function seedBidangBrand(prisma: PrismaClient) {
  console.log("Seeding Bidang Brand...");

  const filePath = path.join(
    process.cwd(),
    "documentation",
    "data_json",
    "bidang_brand.json",
  );

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}, skipping seedBidangBrand.`);
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData) as BidangBrandJson;

  let count = 0;
  for (const item of data.sponsorship_categories) {
    if (!item.category) continue;

    const createdItem = await prisma.m_bidang_brand.upsert({
      where: { nama_bidang: item.category },
      update: {},
      create: {
        nama_bidang: item.category,
        deskripsi_bidang: item.description || null,
      },
    });
    count++;
  }

  console.log(`✅ Berhasil seed ${count} bidang brand dari JSON`);
}
