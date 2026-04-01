import { Metadata } from "next";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://karangtarunamojosongo.com";

export function generateMetadata({
  title,
  description,
  image = "/image/logo/logo.png",
  path = "",
}: {
  title: string;
  description: string;
  image?: string;
  path?: string;
}): Metadata {
  return {
    title: `${title} | Karang Taruna Mojosongo`,
    description,
    openGraph: {
      title: `${title} | Karang Taruna Mojosongo`,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "Karang Taruna Mojosongo",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Karang Taruna Mojosongo`,
      description,
      images: [image],
    },
  };
}

export function generateJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Karang Taruna Kelurahan Mojosongo",
    url: SITE_URL,
    logo: `${SITE_URL}/image/logo/logo.png`,
    sameAs: [
      "https://www.instagram.com/karangtarunamojosongo", // Placeholder
      "https://www.youtube.com/@karangtarunamojosongo",
    ],
  };
}
