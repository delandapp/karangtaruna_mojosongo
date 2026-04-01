import { generateMetadata } from "@/lib/seo";
import Home from "@/pages/Home";

export const metadata = generateMetadata({
  title: "Beranda",
  description: "Website Resmi Karang Taruna Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta.",
});

export default function Page() {
  return <Home />;
}
