import { PrismaClient } from "@prisma/client";

export async function seedLevels(prisma: PrismaClient) {
  // 1. Seed Tingkatan Level
  const levels = [
    "superuser",
    "admin",
    "ketua",
    "wakil ketua",
    "seketaris",
    "bendahara",
    "koordinator",
    "anggota",
  ];

  console.log("Seeding levels...");
  for (const levelName of levels) {
    await prisma.m_level.upsert({
      where: { nama_level: levelName },
      update: {},
      create: { nama_level: levelName },
    });
  }
}
