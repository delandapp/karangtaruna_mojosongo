import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

export async function seedKategoriSponsor(prisma: PrismaClient) {
  console.log("Seeding kategori sponsor (company categories)...");

  // Baca file JSON
  const jsonPath = path.join(
    __dirname,
    "../../documentation/data_json/kategori_sponsor.json",
  );

  if (!fs.existsSync(jsonPath)) {
    console.warn(
      "File kategori_brand.json tidak ditemukan, melewati proses seeding.",
    );
    return;
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const parsedData = JSON.parse(rawData);

  if (!parsedData || !Array.isArray(parsedData)) {
    console.warn("Format JSON tidak valid, melewati proses seeding.");
    return;
  }

  for (const item of parsedData) {
    await prisma.m_kategori_sponsor.upsert({
      where: { nama_kategori: item.nama_kategori },
      update: {
        deskripsi_kategori: item.deskripsi_kategori,
      },
      create: {
        nama_kategori: item.nama_kategori,
        deskripsi_kategori: item.deskripsi_kategori,
      },
    });
  }
}
