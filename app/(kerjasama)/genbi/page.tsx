import { Metadata } from "next";
import GenbiFlipbookWrapper from "./GenbiFlipbookWrapper";
import { GENBI_CONFIG } from "./constants";

export const metadata: Metadata = {
  title: `${GENBI_CONFIG.namaKegiatan} - ${GENBI_CONFIG.motto}`,
  description: GENBI_CONFIG.deskripsi,
  keywords: [
    "GENABLE",
    "GenBI",
    "Bank Indonesia",
    "Karang Taruna Mojosongo",
    "Pemkot Surakarta",
    "Digitalisasi UMKM",
    "Pemberdayaan Ekonomi",
    "Proposal Kerjasama",
  ],
  openGraph: {
    title: `${GENBI_CONFIG.namaKegiatan} - Proposal Kerjasama Strategis`,
    description: GENBI_CONFIG.motto,
    type: "article",
    images: [
      {
        url: "/image/logo/logo-karang-taruna.png",
        width: 600,
        height: 600,
        alt: "Logo Karang Taruna Mojosongo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${GENBI_CONFIG.namaKegiatan} - Proposal Kerjasama Strategis`,
    description: GENBI_CONFIG.motto,
  },
};

export default function GenbiPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[#090d16]">
      <GenbiFlipbookWrapper />
    </main>
  );
}
