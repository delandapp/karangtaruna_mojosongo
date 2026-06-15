/**
 * Gallery data source — Karang Taruna Mojosongo
 * Setiap album memiliki cover (untuk thumbnail) dan daftar foto.
 * Path menggunakan /gallery/... karena gambar disimpan di public/gallery/
 */

export type GalleryCategory = "semua" | "sosial" | "pendidikan" | "seni-budaya";

export interface GalleryPhoto {
  src: string;
  alt: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: GalleryCategory;
  cover: string;       // path publik ke cover image (include ekstensi)
  photos: GalleryPhoto[];
  photoCount: number;
}

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "festival-ramadhan-2026",
    title: "Festival Ramadhan 2026",
    description: "Perayaan Festival Ramadhan penuh semangat bersama warga Mojosongo dengan berbagai kegiatan islami dan bazaar.",
    date: "15 Apr 2026",
    location: "Mojosongo, Surakarta",
    category: "seni-budaya",
    cover: "/gallery/festival-ramadhan-2026/cover.jpg",
    photos: [],
    photoCount: 1,
  },
  {
    id: "makrab-2025",
    title: "Malam Keakraban Pemuda 2025",
    description: "Momen kebersamaan dan penguatan tali silaturahmi antar anggota Karang Taruna dalam acara Malam Keakraban.",
    date: "20 Nov 2025",
    location: "Tawangmangu",
    category: "sosial",
    cover: "/gallery/makrab-2025/cover.jpg",
    photos: [
      { src: "/gallery/makrab-2025/foto-kti-makrab-3.png", alt: "Momen Makrab 1" },
      { src: "/gallery/makrab-2025/foto-kti-makrab-4.png", alt: "Momen Makrab 2" },
    ],
    photoCount: 3,
  },
  {
    id: "sosialisasi-literasi-pajak-2026",
    title: "Sosialisasi Literasi Digital Pajak",
    description: "Program edukasi perpajakan digital untuk meningkatkan kesadaran pemuda dalam kepatuhan pajak.",
    date: "08 Mar 2026",
    location: "Kelurahan Mojosongo",
    category: "pendidikan",
    cover: "/gallery/sosialisasi-literasi-pajak-2026/cover.png",
    photos: [
      { src: "/gallery/sosialisasi-literasi-pajak-2026/foto-sosialisasi-pajak-2.png", alt: "Sosialisasi Pajak 2" },
      { src: "/gallery/sosialisasi-literasi-pajak-2026/foto-sosialisasi-pajak-3.png", alt: "Sosialisasi Pajak 3" },
      { src: "/gallery/sosialisasi-literasi-pajak-2026/foto-sosialisasi-pajak-4.png", alt: "Sosialisasi Pajak 4" },
      { src: "/gallery/sosialisasi-literasi-pajak-2026/foto-sosialisasi-pajak-5.png", alt: "Sosialisasi Pajak 5" },
    ],
    photoCount: 5,
  },
  {
    id: "peer-education-judi-online",
    title: "Peer Education: Bahaya Judi Online",
    description: "Kegiatan sosialisasi untuk meningkatkan kesadaran pemuda tentang dampak negatif judi online.",
    date: "20 Feb 2026",
    location: "Kelurahan Mojosongo",
    category: "pendidikan",
    cover: "/gallery/peer-education-judi-online/cover.jpeg",
    photos: [
      { src: "/gallery/peer-education-judi-online/foto-1.jpeg", alt: "Peer Education 1" },
      { src: "/gallery/peer-education-judi-online/foto-2.jpeg", alt: "Peer Education 2" },
      { src: "/gallery/peer-education-judi-online/foto-3.jpeg", alt: "Peer Education 3" },
    ],
    photoCount: 4,
  },
  {
    id: "sumpah-pemuda",
    title: "Peringatan Hari Sumpah Pemuda",
    description: "Upacara dan kegiatan peringatan Hari Sumpah Pemuda yang penuh semangat nasionalisme bersama seluruh warga.",
    date: "28 Okt 2025",
    location: "Kelurahan Mojosongo",
    category: "seni-budaya",
    cover: "/gallery/sumpah-pemuda/cover.png",
    photos: [
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-1.png", alt: "Sumpah Pemuda 1" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-2.png", alt: "Sumpah Pemuda 2" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-3.png", alt: "Sumpah Pemuda 3" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-4.png", alt: "Sumpah Pemuda 4" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-5.png", alt: "Sumpah Pemuda 5" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-6.png", alt: "Sumpah Pemuda 6" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-7.png", alt: "Sumpah Pemuda 7" },
      { src: "/gallery/sumpah-pemuda/foto-kti-sumpah-pemuda-8.png", alt: "Sumpah Pemuda 8" },
    ],
    photoCount: 9,
  },
  {
    id: "donasi-sumatra-2025",
    title: "Aksi Donasi Bencana Sumatra 2025",
    description: "Aksi solidaritas dan penggalangan donasi untuk membantu korban bencana alam di Sumatra.",
    date: "12 Mar 2025",
    location: "Mojosongo & Sumatra",
    category: "sosial",
    cover: "/gallery/donasi-sumatra-2025/cover.jpg",
    photos: [],
    photoCount: 1,
  },
  {
    id: "latihan-badminton",
    title: "Latihan Rutin Bulutangkis Pemuda",
    description: "Kegiatan olahraga bulutangkis rutin anggota Karang Taruna Mojosongo untuk menjaga kebugaran dan mempererat kebersamaan.",
    date: "12 Mei 2026",
    location: "Gedung Olahraga Kelurahan Mojosongo",
    category: "sosial",
    cover: "/gallery/latihan-badminton/cover.png",
    photos: [
      { src: "/gallery/latihan-badminton/foto-kti-badminton (1 of 5).png", alt: "Latihan Bulutangkis 1" },
      { src: "/gallery/latihan-badminton/foto-kti-badminton (2 of 5).png", alt: "Latihan Bulutangkis 2" },
      { src: "/gallery/latihan-badminton/foto-kti-badminton (3 of 5).png", alt: "Latihan Bulutangkis 3" },
      { src: "/gallery/latihan-badminton/foto-kti-badminton (4 of 5).png", alt: "Latihan Bulutangkis 4" },
    ],
    photoCount: 5,
  },
  {
    id: "lomba-krenova-2026",
    title: "Partisipasi Lomba Krenova 2026",
    description: "Perwakilan pemuda Karang Taruna Mojosongo mempresentasikan proposal inovasi teknologi tepat guna pada ajang Krenova Kota Surakarta.",
    date: "24 Apr 2026",
    location: "Bappeda Kota Surakarta",
    category: "pendidikan",
    cover: "/gallery/lomba-krenova-2026/cover.png",
    photos: [
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (1 of 8).png", alt: "Presentasi Krenova 1" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (2 of 8).png", alt: "Presentasi Krenova 2" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (3 of 8).png", alt: "Presentasi Krenova 3" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (4 of 8).png", alt: "Presentasi Krenova 4" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (5 of 8).png", alt: "Presentasi Krenova 5" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (6 of 8).png", alt: "Presentasi Krenova 6" },
      { src: "/gallery/lomba-krenova-2026/foto-kti-krenova (8 of 8).png", alt: "Presentasi Krenova 7" },
    ],
    photoCount: 8,
  },
  {
    id: "pemilihan-ketua-2025",
    title: "Temu Karya & Pemilihan Ketua",
    description: "Proses demokrasi pemilihan Ketua Karang Taruna Kelurahan Mojosongo masa bakti terbaru yang berjalan lancar dan khidmat.",
    date: "11 Des 2025",
    location: "Aula Kelurahan Mojosongo",
    category: "sosial",
    cover: "/gallery/pemilihan-ketua-2025/cover.jpg",
    photos: [
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0352.jpg", alt: "Pemilihan Ketua 1" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0468.jpg", alt: "Pemilihan Ketua 2" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0489.jpg", alt: "Pemilihan Ketua 3" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0530.jpg", alt: "Pemilihan Ketua 4" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0540.jpg", alt: "Pemilihan Ketua 5" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251211-WA0552.jpg", alt: "Pemilihan Ketua 6" },
      { src: "/gallery/pemilihan-ketua-2025/IMG-20251212-WA0012.jpg", alt: "Pemilihan Ketua 7" },
    ],
    photoCount: 8,
  },
  {
    id: "latihan-karawitan",
    title: "Latihan Seni Musik Tradisional Karawitan",
    description: "Upaya pelestarian kebudayaan Jawa oleh generasi muda Mojosongo melalui latihan rutin gamelan dan karawitan.",
    date: "15 Okt 2025",
    location: "Pendopo Kelurahan Mojosongo",
    category: "seni-budaya",
    cover: "/gallery/latihan-karawitan/cover.jpeg",
    photos: [],
    photoCount: 1,
  },
  {
    id: "hari-jadi-solo-2026",
    title: "Partisipasi Hari Jadi Kota Surakarta",
    description: "Keikutsertaan pengurus Karang Taruna Kelurahan Mojosongo dalam upacara dan parade budaya perayaan Hari Jadi ke-281 Kota Surakarta.",
    date: "17 Feb 2026",
    location: "Stadion Sriwedari",
    category: "seni-budaya",
    cover: "/gallery/hari-jadi-solo-2026/cover.jpeg",
    photos: [
      { src: "/gallery/hari-jadi-solo-2026/foto.jpeg", alt: "Upacara Hari Jadi Solo 1" },
      { src: "/gallery/hari-jadi-solo-2026/foto-2.jpeg", alt: "Upacara Hari Jadi Solo 2" },
    ],
    photoCount: 3,
  },
  {
    id: "penutupan-tmmd-tahap-2",
    title: "Upacara Penutupan TMMD Tahap II",
    description: "Partisipasi aktif Karang Taruna Kelurahan Mojosongo dalam upacara penutupan TNI Manunggal Membangun Desa (TMMD) Sengkuyung Tahap II.",
    date: "10 Agt 2025",
    location: "Mojosongo, Surakarta",
    category: "sosial",
    cover: "/gallery/penutupan-tmmd-tahap-2/cover.png",
    photos: [
      { src: "/gallery/penutupan-tmmd-tahap-2/foto-penutupan-tmmd.png", alt: "Penutupan TMMD 1" },
      { src: "/gallery/penutupan-tmmd-tahap-2/foto-penutupan-tmmd-3.png", alt: "Penutupan TMMD 2" },
    ],
    photoCount: 3,
  },
  {
    id: "sosialisasi-narkoba-2026",
    title: "Sosialisasi Pencegahan Penyalahgunaan Narkoba",
    description: "Edukasi bahaya narkotika dan obat-obatan terlarang bagi generasi muda di lingkungan kelurahan Mojosongo.",
    date: "10 Mar 2026",
    location: "Aula Kelurahan Mojosongo",
    category: "pendidikan",
    cover: "/gallery/sosialisasi-narkoba-2026/cover.HEIC",
    photos: [],
    photoCount: 1,
  },
  {
    id: "dokumentasi-pupuk",
    title: "Pembuatan & Penyaluran Pupuk Organik",
    description: "Kegiatan pelatihan pembuatan pupuk organik ramah lingkungan bersama warga untuk mendukung ketahanan pangan lokal.",
    date: "05 Nov 2025",
    location: "KWT Mojosongo",
    category: "sosial",
    cover: "/gallery/dokumentasi-pupuk/cover.jpg",
    photos: [
      { src: "/gallery/dokumentasi-pupuk/IMG_1474.HEIC", alt: "Pembuatan Pupuk 1" },
    ],
    photoCount: 2,
  },
  {
    id: "pelantikan-pengurus-2025",
    title: "Pelantikan Pengurus Karang Taruna Mojosongo",
    description: "Prosesi pengukuhan dan pelantikan resmi kepengurusan baru Karang Taruna Kelurahan Mojosongo masa bakti 2025-2030.",
    date: "25 Jan 2025",
    location: "Pendopo Kelurahan Mojosongo",
    category: "sosial",
    cover: "/gallery/pelantikan-pengurus-2025/cover.png",
    photos: [
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (9 of 87).png", alt: "Pelantikan Pengurus 1" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (14 of 87).png", alt: "Pelantikan Pengurus 2" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (26 of 87).png", alt: "Pelantikan Pengurus 3" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (44 of 87).png", alt: "Pelantikan Pengurus 4" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (54 of 87).png", alt: "Pelantikan Pengurus 5" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (68 of 87).png", alt: "Pelantikan Pengurus 6" },
      { src: "/gallery/pelantikan-pengurus-2025/foto-kti-pengukuhan (73 of 87).png", alt: "Pelantikan Pengurus 7" },
    ],
    photoCount: 8,
  },
  {
    id: "buka-bersama-2026",
    title: "Buka Bersama & Silaturahmi Akbar",
    description: "Momen kebersamaan berbuka puasa bersama seluruh pengurus, anggota, dan tokoh masyarakat kelurahan Mojosongo.",
    date: "28 Mar 2026",
    location: "Kelurahan Mojosongo",
    category: "sosial",
    cover: "/gallery/buka-bersama-2026/cover.png",
    photos: [
      { src: "/gallery/buka-bersama-2026/foto-kti-buka-bersama (1 of 6).png", alt: "Buka Bersama 1" },
      { src: "/gallery/buka-bersama-2026/foto-kti-buka-bersama (2 of 6).png", alt: "Buka Bersama 2" },
      { src: "/gallery/buka-bersama-2026/foto-kti-buka-bersama (3 of 6).png", alt: "Buka Bersama 3" },
      { src: "/gallery/buka-bersama-2026/foto-kti-buka-bersama (4 of 6).png", alt: "Buka Bersama 4" },
      { src: "/gallery/buka-bersama-2026/foto-kti-buka-bersama (5 of 6).png", alt: "Buka Bersama 5" },
    ],
    photoCount: 6,
  },
];

export const galleryCategories: { label: string; value: GalleryCategory }[] = [
  { label: "Semua", value: "semua" },
  { label: "Sosial", value: "sosial" },
  { label: "Pendidikan", value: "pendidikan" },
  { label: "Seni & Budaya", value: "seni-budaya" },
];

/** Helper: filter album berdasarkan kategori */
export function filterAlbumsByCategory(
  albums: GalleryAlbum[],
  category: GalleryCategory
): GalleryAlbum[] {
  if (category === "semua") return albums;
  return albums.filter((a) => a.category === category);
}
