import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

export async function seedUsers(prisma: PrismaClient) {
  console.log("Seeding users...");

  const saltRounds = 10;
  const hashPassword = await bcrypt.hash("Mojosongo2026", saltRounds);

  // ── Ambil semua level & jabatan sekaligus ──────────────────────────────────
  const [
    superuserLvl,
    adminLvl,
    ketuaLvl,
    wakilKetuaLvl,
    sekretarisLvl,
    bendaharaLvl,
    koordinatorLvl,
    anggotaLvl,
  ] = await Promise.all([
    prisma.m_level.findUnique({ where: { nama_level: "superuser" } }),
    prisma.m_level.findUnique({ where: { nama_level: "admin" } }),
    prisma.m_level.findUnique({ where: { nama_level: "ketua" } }),
    prisma.m_level.findUnique({ where: { nama_level: "wakil ketua" } }),
    prisma.m_level.findUnique({ where: { nama_level: "seketaris" } }),
    prisma.m_level.findUnique({ where: { nama_level: "bendahara" } }),
    prisma.m_level.findUnique({ where: { nama_level: "koordinator" } }),
    prisma.m_level.findUnique({ where: { nama_level: "anggota" } }),
  ]);

  const [
    jabatanPJ,
    jabatanKetua,
    jabatanWakilKetua,
    jabatanSekretaris,
    jabatanBendahara,
    jabatanSDM,
    jabatanEkonomi,
    jabatanMental,
    jabatanOlahraga,
    jabatanHumas,
  ] = await Promise.all([
    prisma.m_jabatan.findUnique({
      where: { nama_jabatan: "Penanggung Jawab" },
    }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Ketua" } }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Wakil Ketua" } }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Sekretaris" } }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Bendahara" } }),
    prisma.m_jabatan.findUnique({
      where: { nama_jabatan: "Bidang Sdm" },
    }),
    prisma.m_jabatan.findUnique({
      where: {
        nama_jabatan: "Bidang Parenkraf",
      },
    }),
    prisma.m_jabatan.findUnique({
      where: { nama_jabatan: "Bidang Keagamaan" },
    }),
    prisma.m_jabatan.findUnique({
      where: {
        nama_jabatan: "Bidang Olahraga",
      },
    }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Bidang Humas" } }),
  ]);

  let phoneCounter = 1;

  // ── Helper upsert user ────────────────────────────────────────────────────
  const upsert = async (
    username: string,
    nama_lengkap: string,
    levelId: number,
    jabatanId: number,
  ) => {
    const fakePhone = "08" + String(phoneCounter++).padStart(9, "0");
    await prisma.m_user.upsert({
      where: { username },
      update: {},
      create: {
        nama_lengkap,
        username,
        password: hashPassword,
        no_handphone: fakePhone,
        rt: "00",
        rw: "00",
        alamat: "Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta",
        m_level_id: levelId,
        m_jabatan_id: jabatanId,
      },
    });
  };

  // ── 1. Superuser (sistem) ─────────────────────────────────────────────────
  if (superuserLvl && jabatanPJ) {
    await upsert(
      "kti_mojosongo",
      "Karang Taruna Kelurahan Mojosongo",
      superuserLvl.id,
      jabatanPJ.id,
    );
  }

  // ── 2. Pengurus Inti ──────────────────────────────────────────────────────
  if (ketuaLvl && jabatanKetua) {
    await upsert(
      "deland",
      "Muhammad Deland Arjuna Putra",
      ketuaLvl.id,
      jabatanKetua.id,
    );
  }
  if (wakilKetuaLvl && jabatanWakilKetua) {
    await upsert(
      "alif",
      "Nuzulul Alif Bintara Rizky",
      wakilKetuaLvl.id,
      jabatanWakilKetua.id,
    );
  }
  if (sekretarisLvl && jabatanSekretaris) {
    await upsert(
      "kezia",
      "Kezia Marvela Febriyanti",
      sekretarisLvl.id,
      jabatanSekretaris.id,
    );
    await upsert(
      "risa",
      "Risa Ardia Pramesti",
      sekretarisLvl.id,
      jabatanSekretaris.id,
    );
  }
  if (bendaharaLvl && jabatanBendahara) {
    await upsert(
      "khaila",
      "Khaila Nur Azahra",
      bendaharaLvl.id,
      jabatanBendahara.id,
    );
    await upsert(
      "dita",
      "Dita Indah Sari",
      bendaharaLvl.id,
      jabatanBendahara.id,
    );
  }

  // ── 3. Divisi SDM ─────────────────────────────────────────────────────────
  if (koordinatorLvl && jabatanSDM) {
    await upsert(
      "adia",
      "Adia Purwan Dermawan",
      koordinatorLvl.id,
      jabatanSDM.id,
    );
    await upsert(
      "yusuf",
      "Yusuf Khoirul Huda",
      koordinatorLvl.id,
      jabatanSDM.id,
    );
  }
  if (anggotaLvl && jabatanSDM) {
    await upsert(
      "khalila",
      "Khalila Candra Kinanthi",
      anggotaLvl.id,
      jabatanSDM.id,
    );
    await upsert("ahmad", "Ahmad Dwi Saputro", anggotaLvl.id, jabatanSDM.id);
    await upsert(
      "shiera",
      "Shiera Ranze Azzahra Putrisani",
      anggotaLvl.id,
      jabatanSDM.id,
    );
  }

  // ── 4. Divisi Ekonomi Kreatif ─────────────────────────────────────────────
  if (koordinatorLvl && jabatanEkonomi) {
    await upsert(
      "arsyida",
      "Arsyida Salma",
      koordinatorLvl.id,
      jabatanEkonomi.id,
    );
    await upsert(
      "vony",
      "Vony Nur Jannah",
      koordinatorLvl.id,
      jabatanEkonomi.id,
    );
  }
  if (anggotaLvl && jabatanEkonomi) {
    await upsert(
      "jelita",
      "Jelita Putri Kusumawati",
      anggotaLvl.id,
      jabatanEkonomi.id,
    );
    await upsert(
      "obrien",
      "Obrien Taulani Budiarso",
      anggotaLvl.id,
      jabatanEkonomi.id,
    );
    await upsert(
      "jelita2",
      "Jelita Putri Kusumawati 2",
      anggotaLvl.id,
      jabatanEkonomi.id,
    );
  }

  // ── 5. Divisi Pengembangan Mental ─────────────────────────────────────────
  if (koordinatorLvl && jabatanMental) {
    await upsert(
      "rahmaa",
      "Rahmaa Maaliki Kusuma",
      koordinatorLvl.id,
      jabatanMental.id,
    );
    await upsert(
      "alfiyyah",
      "Alfiyyah Syamsivatun Mudzakkiroh",
      koordinatorLvl.id,
      jabatanMental.id,
    );
  }
  if (anggotaLvl && jabatanMental) {
    await upsert(
      "anisa",
      "Anisa Solekhah Miftahun Janah",
      anggotaLvl.id,
      jabatanMental.id,
    );
    await upsert(
      "maythreea",
      "Maythreea Kaleza Rieskananta",
      anggotaLvl.id,
      jabatanMental.id,
    );
    await upsert("kanya", "Kanya Pambayun", anggotaLvl.id, jabatanMental.id);
  }

  // ── 6. Divisi Olahraga & Seni Budaya ─────────────────────────────────────
  if (koordinatorLvl && jabatanOlahraga) {
    await upsert(
      "helmi",
      "Helmi Surya Ady Saputra",
      koordinatorLvl.id,
      jabatanOlahraga.id,
    );
    await upsert(
      "fathoni",
      "Muchammad Fathoni",
      koordinatorLvl.id,
      jabatanOlahraga.id,
    );
  }
  if (anggotaLvl && jabatanOlahraga) {
    await upsert("eko", "Eko Fitriyanto", anggotaLvl.id, jabatanOlahraga.id);
    await upsert(
      "fransiska",
      "Fransiska Rahayu",
      anggotaLvl.id,
      jabatanOlahraga.id,
    );
    await upsert("bagus", "Bagus Priyanto", anggotaLvl.id, jabatanOlahraga.id);
  }

  // ── 7. Divisi Humas & Komunikasi ──────────────────────────────────────────
  if (koordinatorLvl && jabatanHumas) {
    await upsert("diego", "Diego Prananta", koordinatorLvl.id, jabatanHumas.id);
    await upsert(
      "siti",
      "Siti Zulaikha Wijayanti",
      koordinatorLvl.id,
      jabatanHumas.id,
    );
  }
  if (anggotaLvl && jabatanHumas) {
    await upsert(
      "rifai",
      "Muchammad Rifai Ferdiansyah",
      anggotaLvl.id,
      jabatanHumas.id,
    );
    await upsert(
      "haikal",
      "Haikal Rangga Panji T. D",
      anggotaLvl.id,
      jabatanHumas.id,
    );
    await upsert(
      "syifa",
      "Syifa Alena Prameswari",
      anggotaLvl.id,
      jabatanHumas.id,
    );
  }
}
