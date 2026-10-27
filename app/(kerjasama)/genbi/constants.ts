export interface PartnerLogo {
  name: string;
  shortName: string;
  src: string;
  alt: string;
  isFullRounded?: boolean;
}

export interface DaftarIsiItem {
  urutan: number;
  judul: string;
  halaman: number;
  halamanAkhir?: number;
  labelHalaman: string;
}

export const GENBI_CONFIG = {
  namaKegiatan: "GENABLE",
  motto: "Digitalisasi UMKM dan Pemberdayaan Ekonomi Masyarakat melalui Inovasi Digital",
  tagline: "Kolaborasi Strategis Karang Taruna Mojosongo × Pemkot Surakarta × Bank Indonesia × GenBI UIN",
  deskripsi:
    "Proposal Program GENABLE: Sinergi Digitalisasi UMKM dan Pemberdayaan Ekonomi Masyarakat melalui Inovasi Digital oleh Karang Taruna Mojosongo, Pemerintah Kota Surakarta, Kantor Perwakilan Bank Indonesia, dan GenBI UIN Raden Mas Said Surakarta.",
  // PDF URL Konstan (bisa di-override lewat ENV jika diarahkan ke CDN/S3)
  pdfUrl: process.env.NEXT_PUBLIC_GENBI_PDF_URL || "/pdf/genbi-proposal.pdf",
  whatsappNumber: "0882-3935-2876",
  whatsappUrl:
    "https://wa.me/6288239352876?text=Halo%20Admin%2C%20saya%20telah%20membaca%20Proposal%20GENABLE%20dan%20tertarik%20untuk%20berkolaborasi.",
  // Logo konstan kolaborasi
  logos: [
    {
      name: "Pemerintah Kota Surakarta",
      shortName: "Pemkot Solo",
      src: "/image/logo/logo_pemkot.png",
      alt: "Logo Pemerintah Kota Surakarta",
      isFullRounded: true,
    },
    {
      name: "Karang Taruna Mojosongo",
      shortName: "KTI Mojosongo",
      src: "/image/logo/logo-karang-taruna.png",
      alt: "Logo Karang Taruna Mojosongo",
      isFullRounded: true,
    },
    {
      name: "Bank Indonesia",
      shortName: "Bank Indonesia",
      src: "/image/logo/bank_bi_logo.png",
      alt: "Logo Bank Indonesia",
      isFullRounded: false,
    },
    {
      name: "GenBI UIN Raden Mas Said Surakarta",
      shortName: "GenBI UIN",
      src: "/image/logo/genbi_uin.png",
      alt: "Logo Generasi Baru Indonesia UIN Raden Mas Said Surakarta",
      isFullRounded: true,
    },
  ] as PartnerLogo[],
  // Daftar Isi untuk navigasi cepat flipbook
  daftarIsi: [
    {
      urutan: 1,
      judul: "Cover & Identitas Program",
      halaman: 1,
      halamanAkhir: 1,
      labelHalaman: "Hal 1",
    },
    {
      urutan: 2,
      judul: "Table Of Content & Latar Belakang",
      halaman: 2,
      halamanAkhir: 3,
      labelHalaman: "Hal 2-3",
    },
    {
      urutan: 3,
      judul: "Bentuk Dan Rangkaian Kegiatan",
      halaman: 4,
      halamanAkhir: 6,
      labelHalaman: "Hal 4-5-6",
    },
    {
      urutan: 4,
      judul: "Sasaran & Peserta",
      halaman: 7,
      halamanAkhir: 7,
      labelHalaman: "Hal 7",
    },
    {
      urutan: 5,
      judul: "Waktu & Tempat",
      halaman: 8,
      halamanAkhir: 8,
      labelHalaman: "Hal 8",
    },
    {
      urutan: 6,
      judul: "Estimasi Anggaran Biaya",
      halaman: 9,
      halamanAkhir: 10,
      labelHalaman: "Hal 9-10",
    },
    {
      urutan: 7,
      judul: "Layout Festival",
      halaman: 11,
      halamanAkhir: 11,
      labelHalaman: "Hal 11",
    },
    {
      urutan: 8,
      judul: "Penawaran Sponsorship",
      halaman: 12,
      halamanAkhir: 13,
      labelHalaman: "Hal 12-13",
    },
    {
      urutan: 9,
      judul: "Contact Dan Penutup",
      halaman: 14,
      halamanAkhir: 14,
      labelHalaman: "Hal 14",
    },
  ] as DaftarIsiItem[],
};
