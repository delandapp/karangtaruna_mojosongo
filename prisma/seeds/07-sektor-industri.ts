import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { indexDocument } from "../../lib/elasticsearch";
import { ELASTIC_INDICES } from "../../lib/constants/key";

export async function seedSektorIndustri(prisma: PrismaClient) {
  console.log("Seeding sektor industri...");

  // Baca file JSON
  const jsonPath = path.join(
    __dirname,
    "../../documentation/data_json/sektor_industri.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.warn(
      "File sektor_industri.json tidak ditemukan, melewati proses seeding."
    );
    return;
  }

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const parsedData = JSON.parse(rawData);
  const sectors = parsedData?.seed_data?.m_sektor_industri;

  if (!sectors || !Array.isArray(sectors)) {
    console.warn("Format JSON tidak valid, melewati proses seeding.");
    return;
  }

  for (const item of sectors) {
    const createdItem = await prisma.m_sektor_industri.upsert({
      where: { nama_sektor: item.nama_sektor },
      update: {
        deskripsi_sektor: item.deskripsi_sektor,
      },
      create: {
        nama_sektor: item.nama_sektor,
        deskripsi_sektor: item.deskripsi_sektor,
      },
    });
    await indexDocument(ELASTIC_INDICES.SEKTOR_INDUSTRI, createdItem.id.toString(), createdItem);
  }
}
