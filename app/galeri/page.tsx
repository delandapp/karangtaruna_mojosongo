import { generateMetadata } from "@/lib/seo";
import GalleryPage from "@/views/GalleryPage";

export const metadata = generateMetadata({
  title: "Galeri Kegiatan",
  description:
    "Dokumentasi foto kegiatan Karang Taruna Kelurahan Mojosongo — Festival Ramadhan, Malam Keakraban, Sosialisasi, Peringatan Hari Nasional, dan lebih banyak lagi.",
});

export default function Page() {
  return <GalleryPage />;
}
