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

  // Bersihkan data lama agar tidak duplikat (karena m_hak_akses tidak punya unique constraint)
  await prisma.m_hak_akses_rule.deleteMany({});
  await prisma.m_hak_akses.deleteMany({});

  // Ambil semua level yang dibutuhkan sekaligus
  const [superuserLvl, ketuaLvl, adminLvl, wakilKetuaLvl] = await Promise.all([
    prisma.m_level.findUnique({ where: { nama_level: "superuser" } }),
    prisma.m_level.findUnique({ where: { nama_level: "ketua" } }),
    prisma.m_level.findUnique({ where: { nama_level: "admin" } }),
    prisma.m_level.findUnique({ where: { nama_level: "wakil ketua" } }),
  ]);

  // Helper: buat hak akses + rules sekaligus
  const buatHakAkses = async (
    namaFitur: string,
    tipeFitur: string,
    endpoint: string,
    method: string,
    allowedLevelIds: number[]
  ) => {
    const hak = await prisma.m_hak_akses.create({
      data: {
        nama_fitur: namaFitur,
        tipe_fitur: tipeFitur,
        endpoint,
        method,
        is_all_level: false,
        is_all_jabatan: false,
      },
    });

    await prisma.m_hak_akses_rule.createMany({
      data: allowedLevelIds.map((levelId) => ({
        m_hak_akses_id: hak.id,
        m_level_id: levelId,
      })),
    });
  };

  // Level ID yang digunakan untuk CRUD standar
  // superuser + ketua + admin boleh melakukan semua CRUD
  const crudLevelIds = [superuserLvl?.id, ketuaLvl?.id, adminLvl?.id].filter(
    (id): id is number => id !== undefined
  );

  const organisasiLevelIds = crudLevelIds;

  const eventLevelIds = [superuserLvl?.id, ketuaLvl?.id, adminLvl?.id, wakilKetuaLvl?.id].filter(
    (id): id is number => id !== undefined
  );

  // ── API: Users ──────────────────────────────────────────────────────────────
  const apiUsers = [
    { nama: "Read Users",   tipe: "read",   method: "GET"    },
    { nama: "Create Users", tipe: "create", method: "POST"   },
    { nama: "Update Users", tipe: "update", method: "PUT"    },
    { nama: "Delete Users", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiUsers) {
    await buatHakAkses(item.nama, item.tipe, "/api/users", item.method, crudLevelIds);
  }

  // ── API: Jabatan ─────────────────────────────────────────────────────────────
  const apiJabatan = [
    { nama: "Read Jabatan",   tipe: "read",   method: "GET"    },
    { nama: "Create Jabatan", tipe: "create", method: "POST"   },
    { nama: "Update Jabatan", tipe: "update", method: "PUT"    },
    { nama: "Delete Jabatan", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiJabatan) {
    await buatHakAkses(item.nama, item.tipe, "/api/jabatans", item.method, crudLevelIds);
  }

  // ── API: Level ───────────────────────────────────────────────────────────────
  const apiLevel = [
    { nama: "Read Level",   tipe: "read",   method: "GET"    },
    { nama: "Create Level", tipe: "create", method: "POST"   },
    { nama: "Update Level", tipe: "update", method: "PUT"    },
    { nama: "Delete Level", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiLevel) {
    await buatHakAkses(item.nama, item.tipe, "/api/levels", item.method, crudLevelIds);
  }

  // ── API: Sponsorship/Brands ──────────────────────────────────────────────────
  // superuser + ketua + admin bisa semua CRUD
  const apiBrands = [
    { nama: "Read Sponsorship",   tipe: "read",   method: "GET"    },
    { nama: "Create Sponsorship", tipe: "create", method: "POST"   },
    { nama: "Update Sponsorship", tipe: "update", method: "PUT"    },
    { nama: "Delete Sponsorship", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiBrands) {
    await buatHakAkses(item.nama, item.tipe, "/api/sponsorship/brands", item.method, crudLevelIds);
  }

  // ── API: Hak Akses ───────────────────────────────────────────────────────────
  // superuser + ketua + admin bisa semua CRUD hak akses
  const apiHakAkses = [
    { nama: "Read Hak Akses",   tipe: "read",   method: "GET"    },
    { nama: "Create Hak Akses", tipe: "create", method: "POST"   },
    { nama: "Update Hak Akses", tipe: "update", method: "PUT"    },
    { nama: "Delete Hak Akses", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiHakAkses) {
    await buatHakAkses(item.nama, item.tipe, "/api/hak-akses", item.method, crudLevelIds);
  }

  // ── API: Organisasi ──────────────────────────────────────────────────────────
  const apiOrganisasi = [
    { nama: "Read Organisasi",   tipe: "read",   method: "GET"    },
    { nama: "Create Organisasi", tipe: "create", method: "POST"   },
    { nama: "Update Organisasi", tipe: "update", method: "PUT"    },
    { nama: "Delete Organisasi", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiOrganisasi) {
    await buatHakAkses(item.nama, item.tipe, "/api/organisasi", item.method, organisasiLevelIds);
  }

  // ── API: Events ──────────────────────────────────────────────────────────────
  const apiEvents = [
    { nama: "Read Events",   tipe: "read",   method: "GET"    },
    { nama: "Create Events", tipe: "create", method: "POST"   },
    { nama: "Update Events", tipe: "update", method: "PUT"    },
    { nama: "Delete Events", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiEvents) {
    await buatHakAkses(item.nama, item.tipe, "/api/events", item.method, eventLevelIds);
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
