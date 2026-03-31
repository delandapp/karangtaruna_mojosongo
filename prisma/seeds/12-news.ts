import { PrismaClient } from "@prisma/client";
import { indexDocument } from "../../lib/elasticsearch";
import { ELASTIC_INDICES } from "../../lib/constants/key";

type KategoriSeed = {
  nama_kategori: string;
  slug_kategori: string;
  deskripsi?: string;
};

type BeritaSeed = {
  judul: string;
  slug: string;
  kategoriSlug: string;
  paragraphs: string[];
  jumlah_tayang: number;
  publishedAt: Date;
  thumbnailUrl: string;
  status: "terbit" | "draft" | "review" | "arsip";
};

const PENULIS_USERNAME = "deland";

// Konten dummy diambil dari `my-app/arsitekture.md` (disederhanakan agar cocok
// dengan model Prisma repo saat ini yang tidak memiliki tag/cover terpisah).
const KATEGORI_DATA: KategoriSeed[] = [
  {
    nama_kategori: "Kabar Warga",
    slug_kategori: "kabar-warga",
    deskripsi:
      "Berita dan informasi seputar kehidupan warga di lingkungan sekitar.",
  },
  {
    nama_kategori: "Kegiatan Organisasi",
    slug_kategori: "kegiatan-organisasi",
    deskripsi: "Liputan kegiatan, program, dan agenda Karang Taruna.",
  },
  {
    nama_kategori: "Pemberdayaan Ekonomi",
    slug_kategori: "pemberdayaan-ekonomi",
    deskripsi: "Informasi UMKM, pelatihan wirausaha, dan peluang usaha warga.",
  },
  {
    nama_kategori: "Sosial & Budaya",
    slug_kategori: "sosial-budaya",
    deskripsi:
      "Tradisi lokal, seni budaya, dan kegiatan sosial kemasyarakatan.",
  },
  {
    nama_kategori: "Kepemudaan",
    slug_kategori: "kepemudaan",
    deskripsi:
      "Berita seputar pemuda: pendidikan, karir, olahraga, dan prestasi.",
  },
  {
    nama_kategori: "Lingkungan Hidup",
    slug_kategori: "lingkungan-hidup",
    deskripsi:
      "Isu lingkungan, kebersihan, dan program hijau di lingkungan warga.",
  },
  {
    nama_kategori: "Pengumuman & Informasi",
    slug_kategori: "pengumuman-informasi",
    deskripsi: "Pengumuman resmi, jadwal, dan informasi penting dari pengurus.",
  },
];

function toHtmlParagraphs(paragraphs: string[]) {
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export async function seedNews(prisma: PrismaClient) {
  console.log("Seeding berita & kategori...");

  const penulis = await prisma.m_user.findUnique({
    where: { username: PENULIS_USERNAME },
    select: { id: true, username: true },
  });

  if (!penulis) {
    throw new Error(
      `seedNews: penulis username '${PENULIS_USERNAME}' tidak ditemukan. Pastikan seedUsers sudah dijalankan.`,
    );
  }

  // 1) Seed kategori berita
  const kategoriBySlug = new Map<string, number>();
  for (const kat of KATEGORI_DATA) {
    const result = await prisma.m_kategori_berita.upsert({
      where: { slug: kat.slug_kategori },
      create: {
        nama: kat.nama_kategori,
        slug: kat.slug_kategori,
        deskripsi: kat.deskripsi || null,
      },
      update: {
        nama: kat.nama_kategori,
        deskripsi: kat.deskripsi || null,
      },
    });
    await indexDocument(ELASTIC_INDICES.KATEGORI_BERITA, result.id.toString(), result);
    kategoriBySlug.set(kat.slug_kategori, result.id);
    console.log(`  ✅ kategori: ${kat.nama_kategori} (${result.id})`);
  }

  // 2) Seed dummy berita
  const now = new Date();
  const BERITA_SEED: BeritaSeed[] = [
    {
      judul:
        "Karang Taruna Raih Penghargaan Nasional Kategori Inovasi Sosial 2024",
      slug: "karang-taruna-raih-penghargaan-nasional-inovasi-sosial-2024",
      kategoriSlug: "kegiatan-organisasi",
      paragraphs: [
        "Karang Taruna terus berinovasi dalam menghadirkan program-program yang bermanfaat bagi masyarakat setempat.",
        "Dengan semangat gotong royong, seluruh anggota aktif berpartisipasi dalam setiap kegiatan yang diselenggarakan.",
        "Program ini diharapkan dapat memberikan dampak positif yang berkelanjutan bagi seluruh lapisan masyarakat.",
      ],
      jumlah_tayang: 15420,
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 jam lalu
      thumbnailUrl:
        "https://picsum.photos/seed/karang-taruna-raih-penghargaan-nasional-inovasi-sosial-2024/800/450",
      status: "terbit",
    },
    {
      judul: "Program Pelatihan Digital Marketing Gratis untuk UMKM Warga",
      slug: "pelatihan-digital-marketing-gratis-umkm-warga",
      kategoriSlug: "pemberdayaan-ekonomi",
      paragraphs: [
        "Program pelatihan ini dirancang untuk meningkatkan kapasitas UMKM agar lebih siap menghadapi pemasaran digital.",
        "Pelatihan mencakup strategi konten, optimasi promosi, dan praktik langsung membuat kampanye sederhana.",
        "Diharapkan materi yang diberikan dapat langsung diterapkan oleh pelaku usaha di lingkungan sekitar.",
      ],
      jumlah_tayang: 28900,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 hari lalu
      thumbnailUrl:
        "https://picsum.photos/seed/pelatihan-digital-marketing-gratis-umkm-warga/800/450",
      status: "terbit",
    },
    {
      judul: "Gotong Royong Bersih Desa Menyambut Bulan Kemerdekaan",
      slug: "gotong-royong-bersih-desa-sambut-kemerdekaan",
      kategoriSlug: "kabar-warga",
      paragraphs: [
        "Kegiatan gotong royong diadakan untuk mempererat kebersamaan sekaligus meningkatkan kenyamanan lingkungan.",
        "Seluruh warga berpartisipasi dalam kerja bakti dan pembersihan area sekitar.",
        "Kegiatan ini menjadi bagian dari persiapan menyambut berbagai agenda kemerdekaan.",
      ],
      jumlah_tayang: 312,
      publishedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 menit lalu
      thumbnailUrl:
        "https://picsum.photos/seed/gotong-royong-bersih-desa-sambut-kemerdekaan/800/450",
      status: "terbit",
    },
    {
      judul: "Festival Budaya Tahunan: Menampilkan 20 Kesenian Lokal Daerah",
      slug: "festival-budaya-tahunan-20-kesenian-lokal",
      kategoriSlug: "sosial-budaya",
      paragraphs: [
        "Festival budaya tahunan kembali digelar dengan menghadirkan berbagai kesenian lokal unggulan.",
        "Acara menampilkan 20 kesenian dari kelompok masyarakat di berbagai wilayah.",
        "Melalui festival ini, diharapkan nilai budaya dapat terus tumbuh dan lestari.",
      ],
      jumlah_tayang: 8750,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 hari lalu
      thumbnailUrl:
        "https://picsum.photos/seed/festival-budaya-tahunan-20-kesenian-lokal/800/450",
      status: "terbit",
    },
    {
      judul: "Tim Bola Voli Karang Taruna Juara 1 Tingkat Kabupaten",
      slug: "tim-bola-voli-karang-taruna-juara-kabupaten",
      kategoriSlug: "kepemudaan",
      paragraphs: [
        "Tim bola voli Karang Taruna berhasil meraih Juara 1 pada ajang tingkat kabupaten.",
        "Kemenangan ini menjadi bukti dedikasi, latihan rutin, dan kekompakan tim.",
        "Semoga prestasi ini bisa memotivasi generasi muda lainnya untuk terus berprestasi.",
      ],
      jumlah_tayang: 5200,
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 hari lalu
      thumbnailUrl:
        "https://picsum.photos/seed/tim-bola-voli-karang-taruna-juara-kabupaten/800/450",
      status: "terbit",
    },
    {
      judul: "Tanam 500 Pohon: Aksi Nyata Pemuda Peduli Lingkungan Hidup",
      slug: "tanam-500-pohon-aksi-pemuda-peduli-lingkungan",
      kategoriSlug: "lingkungan-hidup",
      paragraphs: [
        "Kegiatan tanam 500 pohon menjadi bentuk nyata kepedulian pemuda terhadap lingkungan.",
        "Melalui penanaman, diharapkan kualitas udara dan kesadaran lingkungan di sekitar meningkat.",
        "Kegiatan juga diisi edukasi singkat agar warga paham perawatan tanaman yang ditanam.",
      ],
      jumlah_tayang: 3800,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 hari lalu
      thumbnailUrl:
        "https://picsum.photos/seed/tanam-500-pohon-aksi-pemuda-peduli-lingkungan/800/450",
      status: "terbit",
    },
    {
      judul: "Pengumuman: Rapat Pleno Karang Taruna Periode 2024-2026",
      slug: "pengumuman-rapat-pleno-karang-taruna-2024",
      kategoriSlug: "pengumuman-informasi",
      paragraphs: [
        "Rapat pleno Karang Taruna periode 2024-2026 akan dilaksanakan sesuai jadwal yang ditetapkan.",
        "Kegiatan bertujuan untuk evaluasi program serta penyusunan rencana ke depan.",
        "Seluruh anggota dan pengurus diharapkan hadir tepat waktu.",
      ],
      jumlah_tayang: 1100,
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 jam lalu
      thumbnailUrl:
        "https://picsum.photos/seed/pengumuman-rapat-pleno-karang-taruna-2024/800/450",
      status: "terbit",
    },
    {
      judul: "Bakti Sosial Kesehatan: 300 Warga Dapatkan Pemeriksaan Gratis",
      slug: "bakti-sosial-kesehatan-300-warga-gratis",
      kategoriSlug: "sosial-budaya",
      paragraphs: [
        "Bakti sosial kesehatan digelar sebagai bentuk kepedulian kepada warga sekitar.",
        "Sebanyak 300 warga mendapatkan pemeriksaan kesehatan gratis sesuai kebutuhan.",
        "Kegiatan ini juga menyediakan edukasi singkat mengenai pola hidup sehat.",
      ],
      jumlah_tayang: 12300,
      publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 hari lalu
      thumbnailUrl:
        "https://picsum.photos/seed/bakti-sosial-kesehatan-300-warga-gratis/800/450",
      status: "terbit",
    },
  ];

  for (const b of BERITA_SEED) {
    const kategoriId = kategoriBySlug.get(b.kategoriSlug);
    if (!kategoriId) {
      throw new Error(
        `seedNews: kategoriSlug '${b.kategoriSlug}' tidak ditemukan (slug_kategori).`,
      );
    }

    const kontenHtml = toHtmlParagraphs(b.paragraphs);
    const statusMap: Record<string, any> = {
      terbit: "PUBLISHED",
      draft: "DRAFT",
      review: "REVIEW",
      arsip: "ARCHIVED",
    };

    const mappedStatus = statusMap[b.status] || "DRAFT";

    const item = await prisma.c_berita.upsert({
      where: { seo_slug: b.slug },
      create: {
        m_user_id: penulis.id,
        penulis: penulis.username,
        m_kategori_berita_id: kategoriId,
        judul: b.judul,
        seo_slug: b.slug,
        konten_html: kontenHtml,
        konten_plaintext: b.paragraphs.join("\n"),
        konten_json: {},
        status: mappedStatus as any,
        total_views: b.jumlah_tayang,
        published_at: b.publishedAt,
      },
      update: {
        m_user_id: penulis.id,
        penulis: penulis.username,
        m_kategori_berita_id: kategoriId,
        judul: b.judul,
        konten_html: kontenHtml,
        konten_plaintext: b.paragraphs.join("\n"),
        status: mappedStatus as any,
        total_views: b.jumlah_tayang,
        published_at: b.publishedAt,
      },
    });

    if (b.thumbnailUrl) {
      await prisma.c_berita_cover.upsert({
        where: {
          c_berita_id_tipe: {
            c_berita_id: item.id,
            tipe: "LANDSCAPE_16_9",
          },
        },
        create: {
          c_berita_id: item.id,
          tipe: "LANDSCAPE_16_9",
          s3_key: `seed-cover-${b.slug}`,
          s3_url: b.thumbnailUrl,
          mime_type: "image/jpeg",
          width: 800,
          height: 450,
          is_primary: true,
        },
        update: {
          s3_url: b.thumbnailUrl,
        },
      });
    }
    await indexDocument(ELASTIC_INDICES.BERITA, item.id.toString(), item);

    console.log(`  ✅ berita: ${b.judul}`);
  }

  console.log(`Seeding selesai. total berita: ${BERITA_SEED.length}`);
}
