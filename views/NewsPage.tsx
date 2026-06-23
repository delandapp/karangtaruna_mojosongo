"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Eye, Clock, Flame, TrendingUp, Hash, ChevronRight,
  Search, X, ArrowRight, Newspaper, BookOpen, Star,
} from "lucide-react";

import CardNav from "@/components/organisms/cards/NavCard";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useGetBeritaTerbaruQuery,
  useGetBeritaTrendingQuery,
  useGetBeritaTopQuery,
  useGetKategoriBeritaQuery,
  useGetBeritaByKategoriQuery,
  type BeritaCard,
  type KategoriBerita,
} from "@/features/api/beritaApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return "";
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: localeId });
}

function formatViews(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return String(n);
}

// ─── Breaking News Ticker ─────────────────────────────────────────────────────

function BreakingNewsTicker({ items }: { items: BeritaCard[] }) {
  if (!items.length) return null;
  const repeated = [...items, ...items];
  return (
    <div className="bg-destructive text-white overflow-hidden relative">
      <div className="flex items-stretch">
        <div className="flex items-center shrink-0 bg-black/20 px-4 py-2 gap-2 z-10">
          <Flame className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase">Breaking</span>
        </div>
        <div className="overflow-hidden flex-1 py-2">
          <div className="flex animate-wave-medium whitespace-nowrap">
            {repeated.map((item, i) => (
              <Link key={`${item.id}-${i}`} href={`/berita/${item.seo_slug}`}
                className="inline-flex items-center gap-3 px-6 text-sm hover:underline shrink-0">
                <span className="h-1 w-1 rounded-full bg-white/60" />
                {item.judul}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Featured Card ───────────────────────────────────────────────────────

function HeroCard({ item }: { item: BeritaCard }) {
  return (
    <Link href={`/berita/${item.seo_slug}`} className="group relative block overflow-hidden rounded-2xl">
      <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_url}
            alt={item.judul}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Newspaper className="h-20 w-20 text-primary/30" />
          </div>
        )}
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
        <div className="mb-3 flex items-center gap-2">
          <Badge className="bg-primary text-white text-xs px-2.5 py-0.5 font-semibold shadow">
            {item.kategori}
          </Badge>
          {item.is_featured && (
            <Badge className="bg-amber-500 text-white text-xs px-2.5 py-0.5 gap-1 shadow">
              <Star className="h-3 w-3" /> Unggulan
            </Badge>
          )}
        </div>
        <h2 className="font-title text-xl md:text-3xl font-bold text-white leading-tight line-clamp-3 group-hover:text-primary/90 transition-colors">
          {item.judul}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/70">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(item.published_at)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatViews(item.total_views)} ditonton
          </span>
        </div>
      </div>
      {/* Arrow indicator */}
      <div className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <ArrowRight className="h-4 w-4 text-white" />
      </div>
    </Link>
  );
}

// ─── Berita Card ──────────────────────────────────────────────────────────────

function BeritaCard({ item, index = 0 }: { item: BeritaCard; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <Link href={`/berita/${item.seo_slug}`} className="group flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300">
        {/* Thumbnail */}
        <div className="aspect-[16/9] overflow-hidden bg-muted relative">
          {item.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.cover_url} alt={item.judul} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Newspaper className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/60 text-white text-[10px] px-2 py-0.5 backdrop-blur-sm border-0">
              {item.kategori}
            </Badge>
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-title text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.judul}
          </h3>
          <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(item.published_at)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatViews(item.total_views)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Berita Card Skeleton ─────────────────────────────────────────────────────

function BeritaCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar: Trending ────────────────────────────────────────────────────────

function SidebarTrending({ items, loading }: { items: BeritaCard[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Berita Terpopuler</h3>
      </div>
      <div className="divide-y divide-border/30">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-4 w-4 rounded shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        )) : items.slice(0, 5).map((item, i) => (
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
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{item.kategori}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {formatViews(item.total_views)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar: Kategori ────────────────────────────────────────────────────────

function SidebarKategori({ items, activeSlug, onSelect }: {
  items: KategoriBerita[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Kategori</h3>
      </div>
      <div className="p-3 flex flex-wrap gap-2">
        <button
          onClick={() => onSelect("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeSlug === "all"
            ? "bg-primary text-white shadow-sm shadow-primary/30"
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          Semua
        </button>
        {items.map((k) => (
          <button
            key={k.id}
            onClick={() => onSelect(k.slug)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeSlug === k.slug
              ? "text-white shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            style={activeSlug === k.slug
              ? { backgroundColor: k.warna_hex || "var(--color-primary-500)", boxShadow: `0 2px 8px ${k.warna_hex || "var(--color-primary-500)"}40` }
              : undefined}
          >
            {k.nama}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main NewsPage ─────────────────────────────────────────────────────────────

export default function NewsPage() {
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

  const [activeKategori, setActiveKategori] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  // API Queries
  const { data: terbaruData, isFetching: terbaruLoading } = useGetBeritaTerbaruQuery(
    { page, limit: 9 },
    { skip: activeKategori !== "all" || !!searchQuery }
  );
  const { data: trendingData, isFetching: trendingLoading } = useGetBeritaTrendingQuery({ limit: 5 });
  const { data: kategoriData } = useGetKategoriBeritaQuery({ dropdown: true });
  const { data: kategoriBeritaData, isFetching: kategoriLoading } = useGetBeritaByKategoriQuery(
    { slug: activeKategori, page, limit: 9 },
    { skip: activeKategori === "all" }
  );

  const kategoris = (kategoriData?.data as KategoriBerita[]) || [];
  const beritaList: BeritaCard[] = activeKategori !== "all"
    ? (kategoriBeritaData?.data || [])
    : (terbaruData?.data || []);
  const isLoading = activeKategori !== "all" ? kategoriLoading : terbaruLoading;
  const totalPages = activeKategori !== "all"
    ? (kategoriBeritaData?.meta?.totalPages || 0)
    : (terbaruData?.meta?.totalPages || 0);

  // Featured (first item from trending or terbaru)
  const featured = beritaList.find((b) => b.is_featured) || beritaList[0];
  const breakingNews = (trendingData?.data || []).filter((b) => b.is_breaking_news);
  const gridItems = featured ? beritaList.filter((b) => b.id !== featured.id) : beritaList;

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleKategoriSelect = (slug: string) => {
    setActiveKategori(slug);
    setPage(1);
    setSearchQuery("");
    setSearchInput("");
  };

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

      {/* Breaking News */}
      {breakingNews.length > 0 && <BreakingNewsTicker items={breakingNews} />}

      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* ── Page Header ── */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">Portal Berita</p>
              <h1 className="font-title text-3xl md:text-4xl font-bold text-foreground">Berita Terkini</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Informasi dan kabar terbaru dari Karang Taruna Mojosongo
              </p>
            </div>
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari berita..."
                  className="pl-9 pr-4 w-56 bg-card/60 border-border/60 focus-visible:ring-primary/50 text-sm"
                />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="shrink-0 shadow-sm shadow-primary/20">
                Cari
              </Button>
            </form>
          </div>

          {/* ── Main Grid Layout ── */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">

            {/* ── Left: Berita Content ── */}
            <div className="flex flex-col gap-8">

              {/* Hero Featured */}
              {!searchQuery && activeKategori === "all" && (
                isLoading ? (
                  <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "16/9" }} />
                ) : featured ? (
                  <HeroCard item={featured} />
                ) : null
              )}

              {/* Kategori Tabs (mobile / inline) */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => handleKategoriSelect("all")}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeKategori === "all"
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  Semua
                </button>
                {kategoris.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => handleKategoriSelect(k.slug)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeKategori === k.slug
                      ? "text-white shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    style={activeKategori === k.slug
                      ? { backgroundColor: k.warna_hex || "var(--color-primary-500)" }
                      : undefined}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>

              {/* Section label */}
              <div className="flex items-center justify-between -mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-1 rounded-full bg-primary" />
                  <h2 className="text-base font-semibold text-foreground">
                    {searchQuery ? `Hasil pencarian "${searchQuery}"` : activeKategori !== "all" ? kategoris.find((k) => k.slug === activeKategori)?.nama || "Berita" : "Berita Terbaru"}
                  </h2>
                </div>
              </div>

              {/* Grid Berita */}
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => <BeritaCardSkeleton key={i} />)}
                  </div>
                ) : gridItems.length > 0 ? (
                  <motion.div
                    key={`${activeKategori}-${page}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    {gridItems.map((item, i) => (
                      <BeritaCard key={item.id} item={item} index={i} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-20 text-center">
                    <Newspaper className="h-16 w-16 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">Belum ada berita untuk kategori ini.</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="bg-card/60 border-border/60">
                    ← Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    Halaman {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="bg-card/60 border-border/60">
                    Selanjutnya →
                  </Button>
                </div>
              )}
            </div>

            {/* ── Right: Sidebar ── */}
            <div className="hidden lg:flex flex-col gap-5">
              <SidebarTrending items={trendingData?.data || []} loading={trendingLoading} />
              <SidebarKategori items={kategoris} activeSlug={activeKategori} onSelect={handleKategoriSelect} />

              {/* Newsletter CTA */}
              <div className="rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 p-5 text-white shadow-lg shadow-primary/20">
                <Hash className="h-8 w-8 mb-3 opacity-70" />
                <h4 className="font-title text-lg font-bold mb-1">Berlangganan Info</h4>
                <p className="text-xs text-white/80 mb-4">Dapatkan update berita terbaru langsung di email Anda.</p>
                <div className="space-y-2">
                  <Input placeholder="Alamat email..." className="bg-white/15 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 text-sm" />
                  <Button className="w-full bg-white text-primary hover:bg-white/90 font-semibold shadow-sm">
                    Berlangganan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
