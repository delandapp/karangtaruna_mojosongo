import type { Metadata } from "next";
import { Oswald, Source_Serif_4, Manrope, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "@/components/ui/sonner";

const fontTitle = Oswald({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-title",
});

const fontBody = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const fontUi = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
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
      <body className={`${fontTitle.variable} ${fontBody.variable} ${fontUi.variable} ${fontPoppins.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
