import { PrismaClient } from "@prisma/client";

export async function seedPlatform(prisma: PrismaClient) {
  console.log("Seeding platform sosial media...");

  const platforms = [
    { nama: "TikTok", slug: "tiktok", ikon_url: null },
    { nama: "Facebook", slug: "facebook", ikon_url: null },
    { nama: "Instagram", slug: "instagram", ikon_url: null },
    { nama: "WhatsApp", slug: "whatsapp", ikon_url: null },
    { nama: "Twitter", slug: "twitter", ikon_url: null },
  ];

  for (const plat of platforms) {
    await prisma.m_platform.upsert({
      where: { slug: plat.slug },
      update: {
        nama: plat.nama,
        ikon_url: plat.ikon_url,
        aktif: true,
      },
      create: {
        nama: plat.nama,
        slug: plat.slug,
        ikon_url: plat.ikon_url,
        aktif: true,
      },
    });
  }
}
