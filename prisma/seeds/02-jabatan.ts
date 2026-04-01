import { PrismaClient } from "@prisma/client";

export async function seedJabatans(prisma: PrismaClient) {
  // 2. Seed Jabatan
  const jabatans = [
    "Penanggung Jawab",
    "Penasehat",
    "Pembimbing",
    "Ketua",
    "Wakil Ketua",
    "Bendahara 1",
    "Bendahara 2",
    "Seketaris 1",
    "Seketaris 2",
    "Bidang Humas",
    "Bidang Sdm",
    "Bidang Keagamaan",
    "Bidang Parenkraf",
    "Bidang Olahraga",
  ];

  console.log("Seeding jabatans...");
  for (const jabatanName of jabatans) {
    await prisma.m_jabatan.upsert({
      where: { nama_jabatan: jabatanName },
      update: {},
      create: { nama_jabatan: jabatanName },
    });
  }
}
