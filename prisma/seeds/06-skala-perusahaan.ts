import { PrismaClient } from "@prisma/client";
import { indexDocument } from "../../lib/elasticsearch";
import { ELASTIC_INDICES } from "../../lib/constants/key";

export async function seedSkalaPerusahaan(prisma: PrismaClient) {
  console.log("Seeding skala perusahaan...");

  const skalaList = ["Mikro", "Kecil", "Menengah", "Besar"];

  for (const skala of skalaList) {
    const item = await prisma.m_skala_perusahaan.upsert({
      where: { nama: skala },
      update: {},
      create: { nama: skala },
    });
    await indexDocument(ELASTIC_INDICES.SKALA_PERUSAHAAN, item.id.toString(), item);
  }
}
