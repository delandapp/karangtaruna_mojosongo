import { Metadata } from "next";
import NewsPage from "@/pages/NewsPage";

export const metadata: Metadata = {
  title: "Berita Terkini | Karang Taruna Mojosongo",
  description:
    "Informasi dan kabar terbaru dari Karang Taruna Kelurahan Mojosongo — kegiatan, pengumuman, dan berita seputar kepemudaan.",
  openGraph: {
    title: "Berita Terkini | Karang Taruna Mojosongo",
    description:
      "Informasi dan kabar terbaru dari Karang Taruna Kelurahan Mojosongo — kegiatan, pengumuman, dan berita seputar kepemudaan.",
    type: "website",
  },
};

export default function BeritaRoute() {
  return <NewsPage />;
}
