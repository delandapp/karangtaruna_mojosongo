import type { Metadata } from "next";
import { WhatsAppWebPage } from "@/components/organisms/sosial-media/WhatsAppWebPage";

export const metadata: Metadata = {
  title: "Pesan & DMs — WhatsApp | Dashboard",
  description:
    "Kelola percakapan WhatsApp secara real-time. Baca, balas, kirim gambar & file langsung dari dashboard.",
};

export default function WhatsappChatPage() {
  return <WhatsAppWebPage />;
}
