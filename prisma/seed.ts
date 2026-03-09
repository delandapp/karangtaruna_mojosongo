import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

// Gunakan DIRECT_URL (koneksi langsung ke PostgreSQL) untuk seeding,
// bukan DATABASE_URL yang mengarah ke PgBouncer.
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

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

  // 3. Seed Users
  const saltRounds = 10;
  const hashPassword = await bcrypt.hash("Mojosongo2026", saltRounds);

  console.log("Seeding users...");

  // Cari ID Jabatan dan Level untuk user 1
  const pjJabatan = await prisma.m_jabatan.findUnique({
    where: { nama_jabatan: "Penanggung Jawab" },
  });
  const superuserLevel = await prisma.m_level.findUnique({
    where: { nama_level: "superuser" },
  });

  if (pjJabatan && superuserLevel) {
    await prisma.m_user.upsert({
      where: { username: "kti_mojosongo" },
      update: {},
      create: {
        nama_lengkap: "Karang Taruna Kelurahan Mojosongo",
        username: "kti_mojosongo",
        password: hashPassword,
        no_handphone: "08979341242",
        rt: "00",
        rw: "00",
        alamat:
          "Jl. Brigjend Katamso, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127",
        m_jabatan_id: pjJabatan.id,
        m_level_id: superuserLevel.id,
      },
    });
  }

  // Cari ID Jabatan dan Level untuk user 2
  const ketuaJabatan = await prisma.m_jabatan.findUnique({
    where: { nama_jabatan: "Ketua" },
  });
  const ketuaLevel = await prisma.m_level.findUnique({
    where: { nama_level: "ketua" },
  });

  if (ketuaJabatan && ketuaLevel) {
    await prisma.m_user.upsert({
      where: { username: "deland" },
      update: {},
      create: {
        nama_lengkap: "Muhammad Deland Arjuna Putra",
        username: "deland",
        password: hashPassword,
        no_handphone: "085725631011",
        rt: "03",
        rw: "35",
        alamat:
          "Sabrang Kulon, Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta, Jawa Tengah 57127",
        m_jabatan_id: ketuaJabatan.id,
        m_level_id: ketuaLevel.id,
      },
    });
  }

  // 4. Seed Hak Akses & Rules Role-Based
  console.log("Seeding hak akses & rules...");

  // Endpoint map for generic CRUD models
  const apiModels = [
    { name: "Users", prefix: "/api/users" },
    { name: "Jabatan", prefix: "/api/jabatans" },
    { name: "Level", prefix: "/api/levels" },
  ];

  const methods = ["GET", "POST", "PUT", "DELETE"];

  for (const model of apiModels) {
    for (const method of methods) {
      const typeStr =
        method === "GET"
          ? "Read"
          : method === "POST"
            ? "Create"
            : method === "PUT"
              ? "Update"
              : "Delete";

      const hak = await prisma.m_hak_akses.upsert({
        where: { id: 0 }, // Fake where to force create or use specific unique constraints if we had one
        update: {},
        create: {
          nama_fitur: `${typeStr} ${model.name}`,
          tipe_fitur: typeStr.toLowerCase(),
          endpoint: model.prefix,
          method: method,
          is_all_level: false,
          is_all_jabatan: false,
        },
      });

      // For Users, Jabatan, Level -> only Superuser & Ketua
      const allowedLevels = ["superuser", "ketua"];
      for (const lvl of allowedLevels) {
        const lvlRecord = await prisma.m_level.findUnique({ where: { nama_level: lvl } });
        if (lvlRecord) {
          await prisma.m_hak_akses_rule.create({
            data: {
              m_hak_akses_id: hak.id,
              m_level_id: lvlRecord.id,
              // null jabatan means any jabatan is allowed as long as level matches
            },
          });
        }
      }
    }
  }

  // Khusus Sponsorship
  const spMethods = ["GET", "POST", "PUT", "DELETE"];
  for (const method of spMethods) {
    const typeStr =
      method === "GET"
        ? "Read"
        : method === "POST"
          ? "Create"
          : method === "PUT"
            ? "Update"
            : "Delete";

    const hakSp = await prisma.m_hak_akses.upsert({
      where: { id: 0 },
      update: {},
      create: {
        nama_fitur: `${typeStr} Sponsorship`,
        tipe_fitur: typeStr.toLowerCase(),
        endpoint: "/api/sponsorship/brands", // Contoh endpoint
        method: method,
        is_all_level: false,
        is_all_jabatan: false,
      },
    });

    // Superuser, Admin, Ketua (Any jabatan ok)
    const spAllowedLevels = ["superuser", "admin", "ketua"];
    for (const lvl of spAllowedLevels) {
      const lvlRecord = await prisma.m_level.findUnique({ where: { nama_level: lvl } });
      if (lvlRecord) {
        await prisma.m_hak_akses_rule.create({
          data: {
            m_hak_akses_id: hakSp.id,
            m_level_id: lvlRecord.id,
          },
        });
      }
    }

    // Tapi KHUSUS Koordinator & Anggota, harus jabatan Bidang Humas
    const specialLevels = ["koordinator", "anggota"];
    const humasJabatan = await prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Bidang Humas" } });

    if (humasJabatan) {
      for (const lvl of specialLevels) {
        const lvlRecord = await prisma.m_level.findUnique({ where: { nama_level: lvl } });
        if (lvlRecord) {
          await prisma.m_hak_akses_rule.create({
            data: {
              m_hak_akses_id: hakSp.id,
              m_level_id: lvlRecord.id,
              m_jabatan_id: humasJabatan.id, // AND Condition
            },
          });
        }
      }
    }
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
