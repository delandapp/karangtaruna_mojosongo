import { PrismaClient } from "@prisma/client";

export async function seedOrganisasi(prisma: PrismaClient) {
  console.log("Seeding organisasi...");

  // 1. Cari Referensi Wilayah
  const provinsi = await prisma.m_provinsi.findFirst({
    where: { nama: { equals: "Prov. Jawa Tengah", mode: "insensitive" } },
  });
  const kota = await prisma.m_kota.findFirst({
    where: { nama: { equals: "Kota Surakarta", mode: "insensitive" } },
  });
  const kecamatan = await prisma.m_kecamatan.findFirst({
    where: { nama: { equals: "Kec. Jebres", mode: "insensitive" } },
  });
  const kelurahan = await prisma.m_kelurahan.findFirst({
    where: { nama: { equals: "Mojosongo", mode: "insensitive" } },
  });

  if (!provinsi || !kota || !kecamatan || !kelurahan) {
    console.warn(
      "⚠️ Data wilayah (Jawa Tengah, Surakarta, Jebres, Mojosongo) tidak lengkap di database. Melewati seed organisasi.",
    );
    return;
  }

  const orgs = [
    {
      id: 1,
      nama_org: "Karang Taruna Kelurahan Mojosongo",
      visi: "Mewujudkan generasi muda yang aktif, kreatif, inovatif, dan berjiwa sosial tinggi demi kemajuan lingkungan.",
      misi: "1. Mengembangkan potensi pemuda melalui kegiatan edukatif dan kreatif.\n2. Berperan aktif dalam kegiatan sosial dan pemberdayaan masyarakat.\n3. Membangun kolaborasi yang modern dan inklusif dengan berbagai pihak.",
      alamat:
        "FR4R+JPG, Jl. Brigjend Katamso, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127",
      media_sosial: {
        instagram: "https://instagram.com/karangtaruna.mojosongo",
        tiktok: "https://tiktok.com/@karangtaruna.mojosongo",
        facebook: "https://facebook.com/Karang Taruna Kelurahan Mojosongo",
      },
    },
    {
      id: 2,
      nama_org: "Pokdarwis Kelurahan Mojosongo",
      visi: "Menjadikan Kelurahan Mojosongo sebagai destinasi wisata unggulan berbasis pembedayaan masyarakat yang sadar wisata.",
      misi: "1. Meningkatkan kesadaran masyarakat akan pentingnya potensi pariwisata lokal.\n2. Mengintegrasikan teknologi modern dalam promosi dan pengelolaan wisata desa.\n3. Mewujudkan Sapta Pesona di setiap sudut lingkungan.",
      alamat:
        "FR4R+JPG, Jl. Brigjend Katamso, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127",
      media_sosial: {
        instagram: "https://instagram.com/pokdarwis_mojosongo",
        tiktok: "https://tiktok.com/@pokdarwis_mojosongo",
        facebook: "https://facebook.com/Pokdarwis Kelurahan Mojosongo",
      },
    },
  ];

  for (const org of orgs) {
    await prisma.m_organisasi.upsert({
      where: { id: org.id },
      update: {
        nama_org: org.nama_org,
        visi: org.visi,
        misi: org.misi,
        alamat: org.alamat,
        media_sosial: org.media_sosial,
        kode_wilayah_induk_provinsi: provinsi.kode_wilayah,
        kode_wilayah_induk_kota: kota.kode_wilayah,
        kode_wilayah_induk_kecamatan: kecamatan.kode_wilayah,
        kode_wilayah_induk_kelurahan: kelurahan.kode_wilayah,
      },
      create: {
        id: org.id,
        nama_org: org.nama_org,
        visi: org.visi,
        misi: org.misi,
        alamat: org.alamat,
        media_sosial: org.media_sosial,
        kode_wilayah_induk_provinsi: provinsi.kode_wilayah,
        kode_wilayah_induk_kota: kota.kode_wilayah,
        kode_wilayah_induk_kecamatan: kecamatan.kode_wilayah,
        kode_wilayah_induk_kelurahan: kelurahan.kode_wilayah,
      },
    });
  }

  // Reset sequence
  await prisma.$executeRawUnsafe(
    `SELECT setval('m_organisasi_id_seq', coalesce((SELECT MAX(id) FROM m_organisasi), 1), true);`,
  );
}
