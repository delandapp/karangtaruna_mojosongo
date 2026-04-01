import { PrismaClient } from "@prisma/client";

export async function seedSkalaPerusahaan(prisma: PrismaClient) {
  console.log("Seeding skala perusahaan...");

  const skalaList = ["Mikro", "Kecil", "Menengah", "Besar"];

  for (const skala of skalaList) {
    await prisma.m_skala_perusahaan.upsert({
      where: { nama: skala },
      update: {},
      create: { nama: skala },
    });
  }
}
