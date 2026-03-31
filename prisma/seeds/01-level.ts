import { PrismaClient } from "@prisma/client";
import { indexDocument } from "../../lib/elasticsearch";
import { ELASTIC_INDICES } from "../../lib/constants/key";

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
    const item = await prisma.m_level.upsert({
      where: { nama_level: levelName },
      update: {},
      create: { nama_level: levelName },
    });
    await indexDocument(ELASTIC_INDICES.LEVELS, item.id.toString(), item);
  }
}
