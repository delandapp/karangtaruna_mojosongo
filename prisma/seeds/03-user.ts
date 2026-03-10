import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
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
}
