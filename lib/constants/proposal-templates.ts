import type {
  ProposalTemplate,
  ProposalSectionMeta,
  ProposalData,
  ProposalStyling,
} from "@/lib/types/proposal-template.types";

// =============================================================================
// 9 SECTIONS
// =============================================================================

export const PROPOSAL_SECTIONS: ProposalSectionMeta[] = [
  { id: "latar_belakang",     label: "Latar Belakang",       icon: "BookOpen",     description: "Konteks dan alasan acara",          pageNumber: "01" },
  { id: "tujuan_manfaat",     label: "Tujuan & Manfaat",     icon: "Target",       description: "Tujuan dan manfaat sponsor",         pageNumber: "02" },
  { id: "deskripsi_acara",    label: "Deskripsi Acara",      icon: "CalendarDays", description: "Detail kegiatan dan jadwal",          pageNumber: "03" },
  { id: "profil_peserta",     label: "Profil Peserta",       icon: "Users",        description: "Audiens & demografi",                pageNumber: "04" },
  { id: "data_pendukung",     label: "Data Pendukung",       icon: "BarChart3",    description: "Statistik & trend wilayah",           pageNumber: "05" },
  { id: "anggaran_dana",      label: "Anggaran Dana",        icon: "Wallet",       description: "Rincian alokasi anggaran",            pageNumber: "06" },
  { id: "struktur_panitia",   label: "Struktur Panitia",     icon: "Network",      description: "Susunan organisasi",                  pageNumber: "07" },
  { id: "paket_sponsorship",  label: "Paket Sponsorship",    icon: "Gift",         description: "Pilihan paket & benefit",             pageNumber: "08" },
  { id: "penutup_kontak",     label: "Penutup & Kontak",     icon: "Mail",         description: "Penutup dan informasi kontak",        pageNumber: "09" },
];

// =============================================================================
// STYLING PRESETS
// =============================================================================

const FORMAL_STYLING: ProposalStyling = {
  headingStyle: { fontFamily: "Playfair Display", fontSize: 16, fontWeight: "bold", fontStyle: "normal", color: "#1e3a5f", textAlign: "left" },
  bodyStyle: { fontFamily: "Inter", fontSize: 10, fontWeight: "normal", fontStyle: "normal", color: "#1a1a1a", textAlign: "justify" },
  accentColor: "#1e3a5f",
  coverPageStyle: { backgroundColor: "#1e3a5f" },
  pageStyles: [
    { backgroundColor: "#ffffff" }, { backgroundColor: "#f8fafc" }, { backgroundColor: "#ffffff" },
    { backgroundColor: "#f8fafc" }, { backgroundColor: "#ffffff" }, { backgroundColor: "#f8fafc" },
    { backgroundColor: "#ffffff" }, { backgroundColor: "#f8fafc" }, { backgroundColor: "#ffffff" },
  ],
  tableHeaderBg: "#1e3a5f", tableHeaderColor: "#ffffff",
};

const KREATIF_STYLING: ProposalStyling = {
  headingStyle: { fontFamily: "Poppins", fontSize: 16, fontWeight: "bold", fontStyle: "normal", color: "#7c3aed", textAlign: "left" },
  bodyStyle: { fontFamily: "Poppins", fontSize: 10, fontWeight: "normal", fontStyle: "normal", color: "#18181b", textAlign: "left" },
  accentColor: "#7c3aed",
  coverPageStyle: { backgroundColor: "#7c3aed", backgroundGradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)" },
  pageStyles: [
    { backgroundColor: "#faf5ff" }, { backgroundColor: "#ffffff" }, { backgroundColor: "#faf5ff" },
    { backgroundColor: "#ffffff" }, { backgroundColor: "#faf5ff" }, { backgroundColor: "#ffffff" },
    { backgroundColor: "#faf5ff" }, { backgroundColor: "#ffffff" }, { backgroundColor: "#faf5ff" },
  ],
  tableHeaderBg: "#7c3aed", tableHeaderColor: "#ffffff",
};

const MINIMALIS_STYLING: ProposalStyling = {
  headingStyle: { fontFamily: "Inter", fontSize: 14, fontWeight: "bold", fontStyle: "normal", color: "#18181b", textAlign: "left" },
  bodyStyle: { fontFamily: "Inter", fontSize: 10, fontWeight: "normal", fontStyle: "normal", color: "#3f3f46", textAlign: "left" },
  accentColor: "#334155",
  coverPageStyle: { backgroundColor: "#18181b" },
  pageStyles: Array(9).fill({ backgroundColor: "#ffffff" }),
  tableHeaderBg: "#18181b", tableHeaderColor: "#ffffff",
};

// =============================================================================
// DEFAULT DATA
// =============================================================================

const DATA_PENDUKUNG_FORMAL = {
  narasi: "Berdasarkan data statistik wilayah Mojosongo dan sekitarnya, terdapat potensi pasar yang sangat besar untuk menjangkau target audiens acara ini. Berikut adalah data pendukung yang menunjukkan relevansi dan potensi dampak dari kegiatan yang kami selenggarakan.",
  statistik: [
    { label: "Total Penduduk Usia Produktif", value: "45.000+", icon: "people" },
    { label: "Pengguna Media Sosial Aktif", value: "78%", icon: "social" },
    { label: "Pertumbuhan UMKM Lokal", value: "23% YoY", icon: "growth" },
    { label: "Rata-rata Pengeluaran Konsumer", value: "Rp 2.5 Juta/bln", icon: "money" },
    { label: "Tingkat Literasi Digital", value: "85%", icon: "digital" },
    { label: "Jumlah Event Tahunan", value: "15+ Event", icon: "event" },
  ],
  trendPopuler: [
    { judul: "Peningkatan Belanja Online", deskripsi: "Transaksi e-commerce di wilayah ini meningkat 40% dalam 2 tahun terakhir, menunjukkan kesiapan masyarakat terhadap produk digital." },
    { judul: "Kebangkitan Produk Lokal", deskripsi: "Tren 'beli lokal' meningkatkan minat terhadap UMKM dan produk handmade hingga 35% dibanding tahun sebelumnya." },
    { judul: "Komunitas Kreatif Berkembang", deskripsi: "Lebih dari 20 komunitas kreatif aktif di wilayah ini, dari fotografi, desain grafis, hingga content creation." },
  ],
  sumberData: "BPS Kota Surakarta 2025, Dinas Koperasi & UMKM, Survey Internal Karang Taruna 2025",
};

const FORMAL_DEFAULT: ProposalData = {
  latarBelakang: "Kegiatan ini diselenggarakan sebagai wujud partisipasi aktif generasi muda dalam pembangunan masyarakat. Melalui program ini, kami berupaya menciptakan wadah yang produktif bagi pemuda untuk mengembangkan potensi diri sekaligus memberikan kontribusi nyata bagi lingkungan sekitar.\n\nDengan dukungan sponsor yang tepat, acara ini tidak hanya akan memberikan manfaat edukasi dan ekonomi bagi masyarakat, tetapi juga menjadi platform strategis bagi brand untuk menjangkau segmen pasar yang relevan dan potensial.",
  tujuanAcara: [
    "Memberikan wadah bagi pemuda untuk menyalurkan ide kreatif serta inovasi",
    "Meningkatkan jejaring antara organisasi kepemudaan, pelaku usaha, dan komunitas",
    "Mendukung pertumbuhan ekonomi lokal melalui promosi produk UMKM",
    "Menghadirkan pengalaman edukatif sekaligus inspiratif bagi peserta",
  ],
  manfaatSponsor: [
    "Brand awareness melalui berbagai media promosi (poster, banner, sosial media, backdrop acara)",
    "Memperluas jaringan audiens baru dari kalangan pemuda dan masyarakat umum",
    "Eksposur langsung di lokasi acara melalui booth atau sesi interaktif",
    "Citra positif sebagai brand yang peduli terhadap pengembangan generasi muda",
  ],
  deskripsiAcara: {
    tema: "Bersama Membangun Generasi Muda yang Berdaya",
    bentukKegiatan: "Seminar, Workshop, dan Pameran UMKM",
    jadwal: "2 hari (Sabtu - Minggu)",
    jumlahPeserta: "500",
    detail: "Acara akan berlangsung selama dua hari dengan rangkaian kegiatan berupa seminar kewirausahaan dengan pembicara nasional, workshop keterampilan praktis, dan pameran produk UMKM lokal.\n\nSeluruh kegiatan dirancang untuk memberikan pengalaman yang berkesan dan berdampak bagi seluruh peserta, sekaligus memberikan exposure yang maksimal bagi seluruh mitra sponsor.",
  },
  profilPeserta: {
    usia: "17–30 tahun",
    gender: "Laki-laki dan Perempuan",
    profesi: "Pelajar, Mahasiswa, Pemuda, dan Pelaku UMKM",
    lokasi: "Kecamatan Mojosongo dan sekitarnya",
    narasi: "Target peserta adalah generasi muda usia 17–30 tahun yang aktif di media sosial, memiliki minat tinggi terhadap kewirausahaan, dan memiliki daya beli yang cukup signifikan dalam kategori lifestyle dan digital products.",
  },
  dataPendukung: DATA_PENDUKUNG_FORMAL,
  anggaranDana: {
    totalAnggaran: "Rp 15.000.000",
    alokasi: [
      { kategori: "Operasional & Perlengkapan", persentase: 35 },
      { kategori: "Publikasi & Digital Marketing", persentase: 25 },
      { kategori: "Konsumsi & Hospitality", persentase: 20 },
      { kategori: "Dokumentasi & After-movie", persentase: 12 },
      { kategori: "Dana Tak Terduga", persentase: 8 },
    ],
  },
  strukturPanitia: [
    { nama: "Ahmad Fauzi", posisi: "Ketua Pelaksana" },
    { nama: "Siti Nurhaliza", posisi: "Sekretaris" },
    { nama: "Budi Santoso", posisi: "Bendahara" },
    { nama: "Rina Wulandari", posisi: "Koordinator Acara" },
    { nama: "Dian Prasetyo", posisi: "Koordinator Sponsorship" },
    { nama: "Eko Sulistyo", posisi: "Koordinator Publikasi" },
  ],
  paketSponsorship: [
    { nama: "Platinum", nilai: "Rp 15.000.000", benefits: ["Logo utama di seluruh media promosi", "Booth premium 4×4m di area strategis", "Promosi di seluruh platform media sosial acara", "Penyebutan resmi di setiap sesi acara", "Sesi khusus presentasi produk (15 menit)", "After-movie feature"], headerColor: "#1e3a5f" },
    { nama: "Gold", nilai: "Rp 10.000.000", benefits: ["Logo di backdrop utama dan banner", "Booth reguler 3×3m", "5× publikasi di media sosial acara", "Penyebutan oleh Master of Ceremony"], headerColor: "#b8860b" },
    { nama: "Silver", nilai: "Rp 5.000.000", benefits: ["Logo di banner area", "Booth standar 2×2m", "2× publikasi di media sosial", "Logo di website acara"], headerColor: "#71717a" },
  ],
  penutupKontak: {
    penutup: "Kami sangat berharap kerja sama ini dapat terjalin dengan baik dan memberikan manfaat optimal bagi kedua belah pihak. Dengan kolaborasi yang kuat, kami yakin acara ini akan menjadi momentum yang berdampak positif bagi seluruh stakeholder.\n\nAtas perhatian serta kesempatan yang diberikan, kami mengucapkan terima kasih yang sebesar-besarnya.",
    namaKontak: "Budi Santoso (Ketua Panitia)",
    telepon: "0812-3456-7890",
    email: "panitia@karangtaruna.id",
  },
  images: {},
  styling: FORMAL_STYLING,
};

const KREATIF_DEFAULT: ProposalData = {
  ...FORMAL_DEFAULT,
  latarBelakang: "Festival Kreatif Pemuda 2026 hadir sebagai ajang unjuk kreativitas dan inovasi generasi muda. Di tengah era digital yang terus berkembang, kami percaya bahwa pemuda memiliki potensi besar untuk menjadi motor penggerak perubahan.\n\nAcara ini dirancang untuk mempertemukan talenta muda dengan dunia industri dan bisnis, menciptakan kolaborasi yang saling menguntungkan antara brand, komunitas, dan generasi digital native.",
  deskripsiAcara: {
    tema: "Kreasi Tanpa Batas — Youth Creative Festival",
    bentukKegiatan: "Festival: Talkshow, Kompetisi, Pameran, Live Music",
    jadwal: "3 hari (Jumat - Minggu)",
    jumlahPeserta: "1.000",
    detail: "Festival ini akan berlangsung selama tiga hari dengan rangkaian kegiatan berupa talkshow kewirausahaan, kompetisi ide bisnis, pameran produk UMKM, workshop kreatif, dan hiburan musik malam.\n\nDengan estimasi 1.000 pengunjung per hari, festival ini menjadi salah satu event kepemudaan terbesar di Solo Raya.",
  },
  anggaranDana: { totalAnggaran: "Rp 25.000.000", alokasi: [{ kategori: "Produksi & Panggung", persentase: 35 }, { kategori: "Digital Marketing", persentase: 25 }, { kategori: "Artis & Narasumber", persentase: 20 }, { kategori: "Konsumsi & Hospitality", persentase: 12 }, { kategori: "Dokumentasi", persentase: 8 }] },
  paketSponsorship: [
    { nama: "Title Sponsor", nilai: "Rp 20.000.000", benefits: ["Co-branding nama acara", "Logo utama di semua media", "Full-day stage branding", "Booth flagship 4×4m", "Dedicated social media campaign", "After-movie feature"], headerColor: "#7c3aed" },
    { nama: "Gold Partner", nilai: "Rp 12.000.000", benefits: ["Logo besar di backdrop & banner", "Booth premium 3×3m", "MC mention di setiap sesi", "5× social media shoutout"], headerColor: "#b8860b" },
    { nama: "Silver Partner", nilai: "Rp 6.000.000", benefits: ["Logo di banner area", "Booth standar", "2× social media post", "Logo di tiket & wristband"], headerColor: "#71717a" },
  ],
  penutupKontak: { ...FORMAL_DEFAULT.penutupKontak, namaKontak: "Nisa Rahmawati (Head of Sponsorship)", telepon: "0857-1234-5678", email: "sponsorship@festivalkreatif.id" },
  styling: KREATIF_STYLING,
};

const MINIMALIS_DEFAULT: ProposalData = {
  ...FORMAL_DEFAULT,
  latarBelakang: "Acara ini diadakan untuk mempererat tali silaturahmi antar warga sekaligus mendorong partisipasi pemuda dalam kegiatan positif di lingkungan sekitar.",
  tujuanAcara: ["Mempererat kebersamaan antar warga dan pemuda", "Mendorong partisipasi aktif dalam kegiatan sosial", "Memberikan hiburan dan edukasi bagi masyarakat"],
  manfaatSponsor: ["Logo di banner dan spanduk acara", "Penyebutan nama brand oleh MC", "Kesempatan membagikan sampel produk"],
  deskripsiAcara: { tema: "", bentukKegiatan: "Kegiatan Sosial & Hiburan", jadwal: "1 hari (Minggu)", jumlahPeserta: "200", detail: "Kegiatan satu hari berupa acara sosial, hiburan, dan ramah tamah." },
  anggaranDana: { totalAnggaran: "Rp 5.000.000", alokasi: [{ kategori: "Konsumsi", persentase: 40 }, { kategori: "Perlengkapan", persentase: 30 }, { kategori: "Hiburan", persentase: 20 }, { kategori: "Lain-lain", persentase: 10 }] },
  strukturPanitia: [{ nama: "Nama Ketua", posisi: "Ketua Pelaksana" }, { nama: "Nama Sekretaris", posisi: "Sekretaris" }, { nama: "Nama Bendahara", posisi: "Bendahara" }],
  paketSponsorship: [{ nama: "Utama", nilai: "Rp 3.000.000", benefits: ["Logo utama di spanduk acara", "Penyebutan oleh MC", "Stand promosi"], headerColor: "#18181b" }, { nama: "Pendukung", nilai: "Rp 1.000.000", benefits: ["Logo di banner", "Penyebutan oleh MC"], headerColor: "#71717a" }],
  penutupKontak: { penutup: "Demikian proposal ini kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.", namaKontak: "", telepon: "", email: "" },
  styling: MINIMALIS_STYLING,
};

// =============================================================================
// TEMPLATES
// =============================================================================

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  { id: "formal", nama: "Formal / BUMN", deskripsi: "Format resmi dan profesional, cocok untuk BUMN, instansi, atau perusahaan besar.", accentColor: "from-blue-800 to-blue-950", accentColorHex: "#1e3a5f", badge: "Populer", defaultData: FORMAL_DEFAULT },
  { id: "kreatif", nama: "Kreatif / Event", deskripsi: "Visual modern dan energik, ideal untuk festival, konser, atau event berskala besar.", accentColor: "from-violet-600 to-fuchsia-600", accentColorHex: "#7c3aed", badge: "Baru", defaultData: KREATIF_DEFAULT },
  { id: "minimalis", nama: "Minimalis", deskripsi: "Simpel dan to-the-point, cocok untuk kegiatan RT/RW atau acara kecil.", accentColor: "from-slate-700 to-slate-900", accentColorHex: "#334155", badge: "", defaultData: MINIMALIS_DEFAULT },
];
