import { Metadata } from "next";
import NewsDetailPage from "@/pages/NewsDetailPage";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/berita/slug/${params.slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    const article = data?.data;

    return {
      title: article?.seo_title || `${article?.judul} | Karang Taruna Mojosongo`,
      description: article?.seo_description || article?.konten?.slice(0, 160) || "",
      openGraph: {
        title: article?.seo_title || article?.judul || "",
        description: article?.seo_description || "",
        images: article?.cover_url ? [{ url: article.cover_url, width: 1200, height: 630 }] : [],
        type: "article",
        publishedTime: article?.published_at || undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: article?.judul || "",
        description: article?.seo_description || "",
        images: article?.cover_url ? [article.cover_url] : [],
      },
      keywords: article?.keywords || [],
    };
  } catch {
    return {
      title: "Berita | Karang Taruna Mojosongo",
      description: "Baca berita terkini dari Karang Taruna Mojosongo.",
    };
  }
}

export default function BeritaDetailRoute({ params }: Props) {
  return <NewsDetailPage slug={params.slug} />;
}
