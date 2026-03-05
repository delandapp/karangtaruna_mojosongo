import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Karang Taruna Mojosongo",
    template: "%s | Karang Taruna Mojosongo",
  },
  description:
    "Sistem Informasi Karang Taruna Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta.",
  keywords: ["karang taruna", "mojosongo", "jebres", "surakarta", "pemuda"],
  authors: [{ name: "Karang Taruna Mojosongo" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Karang Taruna Mojosongo",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
