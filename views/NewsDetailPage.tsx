"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft, Eye, Clock, Share2, Facebook, Twitter, Link2,
  Tag, Flame, Newspaper, ChevronRight, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import CardNav from "@/components/organisms/cards/NavCard";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  useGetBeritaBySlugQuery,
  useGetBeritaTrendingQuery,
  useGetBeritaTopQuery,
  type BeritaCard,
} from "@/features/api/beritaApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return String(n);
}

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareButtons({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link berhasil disalin!");
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Bagikan:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank" rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all duration-200"
        title="Bagikan ke Facebook"
      >
        <Facebook className="h-4 w-4" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank" rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/10 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
        title="Bagikan ke X (Twitter)"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <button
        onClick={handleCopyLink}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
        title="Salin link"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Related Card ─────────────────────────────────────────────────────────────

function RelatedCard({ item }: { item: BeritaCard }) {
  return (
    <Link
      href={`/berita/${item.seo_slug}`}
      className="group flex gap-3 rounded-xl border border-border/50 bg-card p-3 hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_url} alt={item.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Newspaper className="h-5 w-5 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Badge variant="outline" className="mb-1 text-[10px] px-1.5 py-0 border-primary/30 bg-primary/5 text-primary">
          {item.kategori}
        </Badge>
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {item.judul}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Eye className="h-3 w-3" />
          <span>{formatViews(item.total_views)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Sidebar: Top Berita ──────────────────────────────────────────────────────

function SidebarTopBerita({ items }: { items: BeritaCard[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Berita Populer</h3>
      </div>
      <div className="divide-y divide-border/30">
        {items.slice(0, 6).map((item, i) => (
          <Link key={item.id} href={`/berita/${item.seo_slug}`}
            className="flex gap-3 p-3 hover:bg-muted/40 transition-colors group">
            <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded text-xs font-bold mt-0.5
              ${i === 0 ? "bg-primary text-white" : i === 1 ? "bg-amber-500 text-white" : i === 2 ? "bg-orange-400 text-white" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                {item.judul}
              </p>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.kategori}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Page Skeleton ─────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-24 h-5 rounded-full" />
      <Skeleton className="w-full h-8" />
      <Skeleton className="w-3/4 h-6" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "16/9" }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NewsDetailPageProps {
  slug: string;
}

export default function NewsDetailPage({ slug }: NewsDetailPageProps) {
  const navItems = [
    {
      label: "Home",
      bgColor: "var(--color-primary-600)",
      textColor: "#fff",
      links: [
        { label: "Halaman Utama", href: "/", ariaLabel: "Home" },
      ],
    },
    {
      label: "Program",
      bgColor: "var(--color-primary-500)",
      textColor: "#fff",
      links: [
        { label: "Lihat Semua Program", href: "/#program", ariaLabel: "Program" },
      ],
    },
    {
      label: "Berita",
      bgColor: "var(--color-accent-500)",
      textColor: "#fff",
      links: [
        { label: "Kabar Terbaru", href: "/berita", ariaLabel: "Berita" },
      ],
    },
    {
      label: "Galeri",
      bgColor: "var(--color-n-800)",
      textColor: "#fff",
      links: [
        { label: "Dokumentasi Foto", href: "/galeri", ariaLabel: "Galeri" },
      ],
    },
  ];

  const router = useRouter();
  const { data: response, isLoading, isError } = useGetBeritaBySlugQuery(slug);
  const { data: topData } = useGetBeritaTopQuery({ limit: 6 });
  const { data: trendingData } = useGetBeritaTrendingQuery({ limit: 4 });

  const article = response?.data;
  const topItems = topData?.data || [];
  const trendingItems = trendingData?.data || [];
  const relatedItems = trendingItems.filter((t) => t.seo_slug !== slug && t.kategori_slug === (article?.kategori_slug || "")).slice(0, 4);
  const fallbackRelated = trendingItems.filter((t) => t.seo_slug !== slug).slice(0, 4);
  const displayRelated = relatedItems.length > 0 ? relatedItems : fallbackRelated;

  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://karangtarunamojosongo.id/berita/${slug}`;

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CardNav
          logo="/image/logo/logo.png"
          logoAlt="Karang Taruna Mojosongo"
          items={navItems}
          baseColor="var(--color-background)"
          menuColor="var(--color-foreground)"
          buttonBgColor="var(--color-primary-500)"
          buttonTextColor="#ffffff"
          ctaLabel="Bergabung"
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pt-32 text-center px-4">
          <Newspaper className="h-20 w-20 text-muted-foreground/30" />
          <h1 className="font-title text-2xl font-bold text-foreground">Berita Tidak Ditemukan</h1>
          <p className="text-muted-foreground text-sm max-w-sm">
            Berita yang Anda cari tidak tersedia atau sudah dihapus.
          </p>
          <Button onClick={() => router.push("/berita")} className="mt-2 gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Berita
          </Button>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <CardNav
        logo="/image/logo/logo.png"
        logoAlt="Karang Taruna Mojosongo"
        items={navItems}
        baseColor="var(--color-background)"
        menuColor="var(--color-foreground)"
        buttonBgColor="var(--color-primary-500)"
        buttonTextColor="#ffffff"
        ctaLabel="Bergabung"
      />

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* ── Breadcrumb ── */}
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Beranda</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/berita" className="hover:text-foreground transition-colors">Berita</Link>
            {article && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/berita?kategori=${article.kategori_slug}`} className="hover:text-foreground transition-colors">
                  {article.kategori}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground line-clamp-1 max-w-[200px]">{article.judul}</span>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">

            {/* ── Article Content ── */}
            <article>
              {isLoading ? (
                <DetailSkeleton />
              ) : article ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Category + Breaking badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-primary text-white text-xs px-3">
                      {article.kategori}
                    </Badge>
                    {article.is_breaking_news && (
                      <Badge className="bg-destructive text-white text-xs gap-1 px-3">
                        <Flame className="h-3 w-3" /> Breaking News
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="font-title text-2xl md:text-4xl font-bold text-foreground leading-tight">
                    {article.judul}
                  </h1>

                  {/* Sub-judul */}
                  {article.sub_judul && (
                    <p className="text-base text-muted-foreground leading-relaxed border-l-4 border-primary/40 pl-4">
                      {article.sub_judul}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {article.penulis && (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {article.penulis[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{article.penulis}</span>
                      </div>
                    )}
                    {article.published_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {format(new Date(article.published_at), "d MMMM yyyy, HH:mm", { locale: localeId })}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {formatViews(article.total_views)} pembaca
                    </span>
                  </div>

                  <Separator className="border-border/50" />

                  {/* Cover Image */}
                  {article.cover_url && (
                    <figure className="overflow-hidden rounded-2xl shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.cover_url}
                        alt={article.judul}
                        className="w-full object-cover"
                        style={{ maxHeight: 480 }}
                      />
                    </figure>
                  )}

                  {/* Article HTML content */}
                  <div
                    className="prose-article"
                    dangerouslySetInnerHTML={{ __html: article.konten || "" }}
                  />

                  <Separator className="border-border/50" />

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Share Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 px-5 py-4">
                    <p className="text-sm font-medium text-foreground">Suka artikel ini? Bagikan ke teman-teman!</p>
                    <ShareButtons url={currentUrl} title={article.judul} />
                  </div>

                  {/* Back button */}
                  <div>
                    <Button variant="outline" asChild className="gap-2 bg-card/60 border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary">
                      <Link href="/berita">
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Berita
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              {/* ── Related Articles ── */}
              {!isLoading && displayRelated.length > 0 && (
                <div className="mt-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-1 rounded-full bg-primary" />
                    <h2 className="text-base font-semibold text-foreground">Berita Terkait</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {displayRelated.map((item) => (
                      <RelatedCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* ── Sidebar ── */}
            <aside className="hidden lg:flex flex-col gap-5">
              <SidebarTopBerita items={topItems} />

              {/* Share (sticky card) */}
              {article && (
                <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bagikan Artikel</p>
                  <ShareButtons url={currentUrl} title={article.judul} />
                </div>
              )}

              {/* Back to news list */}
              <Button variant="outline" asChild className="w-full gap-2 bg-transparent border-border/60">
                <Link href="/berita">
                  <ArrowLeft className="h-4 w-4" />
                  Semua Berita
                </Link>
              </Button>
            </aside>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
