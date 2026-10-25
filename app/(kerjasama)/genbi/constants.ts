export interface PartnerLogo {
  name: string;
  shortName: string;
  src: string;
  alt: string;
}

export interface DaftarIsiItem {
  urutan: number;
  judul: string;
  halaman: number;
}

export const GENBI_CONFIG = {
  namaKegiatan: "GENABLE",
  motto: "Digitalisasi UMKM dan Pemberdayaan Ekonomi Masyarakat melalui Inovasi Digital",
  tagline: "Kolaborasi Strategis Karang Taruna Mojosongo × Pemkot Surakarta × Bank Indonesia × GenBI UIN",
  deskripsi:
    "Proposal Program GENABLE: Sinergi Digitalisasi UMKM dan Pemberdayaan Ekonomi Masyarakat melalui Inovasi Digital oleh Karang Taruna Mojosongo, Pemerintah Kota Surakarta, Kantor Perwakilan Bank Indonesia, dan GenBI UIN Raden Mas Said Surakarta.",
  // PDF URL Konstan (bisa di-override lewat ENV jika diarahkan ke CDN/S3)
  pdfUrl: process.env.NEXT_PUBLIC_GENBI_PDF_URL || "/pdf/genbi-proposal.pdf",
  // Logo konstan kolaborasi
  logos: [
    {
      name: "Pemerintah Kota Surakarta",
      shortName: "Pemkot Solo",
      src: "/image/logo/logo_pemkot.png",
      alt: "Logo Pemerintah Kota Surakarta",
    },
    {
      name: "Karang Taruna Mojosongo",
      shortName: "KTI Mojosongo",
      src: "/image/logo/logo-karang-taruna.png",
      alt: "Logo Karang Taruna Mojosongo",
    },
    {
      name: "Bank Indonesia",
      shortName: "Bank Indonesia",
      src: "/image/logo/bank_bi_logo.png",
      alt: "Logo Bank Indonesia",
    },
    {
      name: "GenBI UIN Raden Mas Said Surakarta",
      shortName: "GenBI UIN",
      src: "/image/logo/genbi_uin.png",
      alt: "Logo Generasi Baru Indonesia UIN Raden Mas Said Surakarta",
    },
  ] as PartnerLogo[],
  // Daftar Isi untuk navigasi cepat flipbook
  daftarIsi: [
    { urutan: 1, judul: "Cover & Identitas Program", halaman: 1 },
    { urutan: 2, judul: "Latar Belakang & Urgensi Digitalisasi", halaman: 2 },
    { urutan: 3, judul: "Maksud, Tujuan & Sasaran Program", halaman: 3 },
    { urutan: 4, judul: "Penutup & Lembar Pengesahan Kemitraan", halaman: 4 },
  ] as DaftarIsiItem[],
};
