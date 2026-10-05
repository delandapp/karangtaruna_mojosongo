import { Metadata } from "next";
import { generateMetadata } from "@/lib/seo";
import SponsorshipView from "@/views/SponsorshipView";

export const metadata: Metadata = generateMetadata({
  title: "Peluang Kemitraan & Sponsorship",
  description:
    "Jadilah mitra strategis Karang Taruna Kelurahan Mojosongo. Jangkau 55.800+ penduduk, 42 RW, puluhan ribu followers aktif, dan 14 media partner Solo Raya.",
});

export default function SponsorshipPage() {
  return <SponsorshipView />;
}
