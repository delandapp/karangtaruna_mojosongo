"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Megaphone,
  Radio,
  Instagram,
} from "lucide-react";
import { MEDIA_PARTNERS } from "@/lib/data/media-partners";
import { cn } from "@/lib/utils";

// Animated SmoothUI, MVP Blocks & React-Bits Components
import GlowHover, {
  type GlowHoverItem,
} from "@/components/smoothui/glow-hover-card";
import TiltCard from "@/components/smoothui/tilt-card";
import CardFlip from "@/components/mvp-blocks/flip-card";
import { AnimatedShinyButton } from "@/components/ui/animated-shiny-button";
import CountUp from "@/components/react-bits/text-count";
import BlurText from "@/components/react-bits/text-blur";
import RotatingText from "@/components/react-bits/text-rotating";
import TrueFocus from "@/components/react-bits/text-true-focus";
import FadeThrough from "@/components/smoothui/fade-through";
import LineByLineSlide from "@/components/smoothui/line-by-line-slide";

export default function SponsorshipView() {
  // Minimalist, elegant sponsorship packages
  const rawPackages = [
    {
      id: "platinum",
      name: "Platinum Partner",
      badge: "Title Sponsor • Utama",
      tagline:
        "Dominasi penuh eksposur brand Anda di seluruh kanal digital dan on-ground event Mojosongo.",
      popular: true,
      theme: { hue: 158, saturation: 80, lightness: 45 },
      features: [
        "Hak Penamaan Eksklusif Acara ('Presented by [Brand]')",
        "Booth Utama VIP Ukuran 6x4m di Titik Paling Strategis",
        "Logo Utama di 25 Titik Baliho, Backdrop, Gapura, & Jersey",
        "5x Video Collab Reels & TikTok @karangtaruna.mojosongo",
        "Publikasi Blast ke 14 Media Partner Terbesar Solo Raya",
        "Laporan Komprehensif ROI & Media Monitoring Pasca-Event",
      ],
      ctaText: "Pilih Paket Platinum",
    },
    {
      id: "gold",
      name: "Gold Partner",
      badge: "Eksposur Tinggi",
      tagline:
        "Visibilitas kuat di panggung utama, media partner pilihan, dan engagement sosial media intensif.",
      popular: false,
      theme: { hue: 45, saturation: 92, lightness: 48 },
      features: [
        "Booth Strategis Ukuran 4x3m di Area Event Utama",
        "Logo Menengah di Backdrop Panggung, Banner, & E-Proposal",
        "3x Video Collab Reels & TikTok + Instagram Story Series",
        "Publikasi Khusus di Media Partner Solo Terpilih",
        "Live Mention MC Setiap 60 Menit Selama Acara",
        "Sertifikat Penghargaan Kemitraan Resmi",
      ],
      ctaText: "Pilih Paket Gold",
    },
    {
      id: "silver",
      name: "Silver Partner",
      badge: "Dukungan Strategis",
      tagline:
        "Solusi hemat biaya untuk penetrasi brand langsung ke komunitas dan pemuda Mojosongo.",
      popular: false,
      theme: { hue: 215, saturation: 75, lightness: 55 },
      features: [
        "Space Booth Ukuran 3x2m di Zona Komersial",
        "Logo di Backdrop Pendukung & Publikasi Sosial Media",
        "1x Postingan Kolaborasi Instagram Feed + Story Blast",
        "Hak Membuka Layanan / Penjualan Produk di Booth",
        "Sertifikat Apresiasi Sponsor Resmi",
      ],
      ctaText: "Pilih Paket Silver",
    },
    {
      id: "bronze",
      name: "Bronze & In-Kind",
      badge: "Fleksibel / Barter",
      tagline:
        "Kolaborasi terbuka untuk barter produk, F&B, sound system, media barter, dan merchandise.",
      popular: false,
      theme: { hue: 25, saturation: 85, lightness: 52 },
      features: [
        "Logo di Materi Komunal Digital & Banner Komunitas",
        "Penyebutan Nama Brand pada Story & Rilis Penutupan",
        "Ruang Distribusi Sampling Produk Terpilih",
        "Sertifikat Penghargaan Resmi Kelurahan",
      ],
      ctaText: "Pilih Paket Bronze",
    },
  ];

  // Map packages into GlowHoverItem elements with a clean, minimalist design
  const glowItems: GlowHoverItem[] = useMemo(() => {
    return rawPackages.map((pkg) => ({
      id: pkg.id,
      theme: pkg.theme,
      element: (
        <div
          className={cn(
            "rounded-3xl p-5 sm:p-6 md:p-7 flex flex-col justify-between transition-all duration-300 relative h-full",
            pkg.popular
              ? "bg-gradient-to-b from-white via-white to-emerald-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-emerald-950/30 border-2 border-emerald-500/50 dark:border-emerald-400/40 shadow-xl"
              : "bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-md backdrop-blur-2xl hover:border-slate-300 dark:hover:border-white/20",
          )}
        >
          {pkg.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Rekomendasi
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {pkg.badge}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-title text-slate-900 dark:text-white">
              {pkg.name}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1 mb-4">
              {pkg.tagline}
            </p>

            {/* Minimalist Features List */}
            <div className="space-y-2 mb-6 pt-3 border-t border-slate-100 dark:border-white/10">
              {pkg.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium leading-tight">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-2">
            <AnimatedShinyButton
              url={`https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship%20Karang%20Taruna%20Mojosongo,%20kami%20tertarik%20dengan%20paket%20sponsorship%20${encodeURIComponent(
                pkg.name,
              )}.`}
              className="w-full text-xs py-2.5 px-4 rounded-xl font-bold text-center justify-center"
            >
              {pkg.ctaText}
            </AnimatedShinyButton>
          </div>
        </div>
      ),
    }));
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Background Ambient iOS 27 Orbs ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-400/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-0" />
      <div className="absolute top-[800px] -right-20 w-[500px] h-[500px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none -z-0" />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-3 sm:top-4 z-50 w-full max-w-6xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 rounded-full bg-white/80 dark:bg-n-900/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white p-0.5 shadow-xs ring-2 ring-emerald-500/30 overflow-hidden shrink-0">
              <Image
                src="/image/logo/logo.png"
                alt="Logo Karang Taruna"
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs sm:text-sm font-bold text-n-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-tight">
                Karang Taruna Mojosongo
              </span>
              <span className="text-[10px] text-n-500 dark:text-n-400">
                Portal Sponsorship Resmi
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-n-600 dark:text-n-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-2.5 sm:px-3 py-1.5 hidden sm:inline-block"
            >
              Beranda
            </Link>
            <AnimatedShinyButton
              url="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship%20Karang%20Taruna%20Mojosongo,%20kami%20tertarik%20untuk%20mengajukan%20kemitraan%20sponsor."
              className="text-xs py-1.5 px-3 sm:py-2 sm:px-4 rounded-full"
            >
              Hubungi Sponsorship
            </AnimatedShinyButton>
          </div>
        </div>
      </header>

      {/* ── Hero Section: Value Proposition & Impact Numbers (Tightened Margins & Responsive Copy) ── */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-14 pb-8 text-center relative z-10">
        {/* Animated Capsule Badge with FadeThrough */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/10 border border-emerald-500/20 shadow-xs backdrop-blur-xl mb-3 sm:mb-4 max-w-full">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <FadeThrough
            phrases={[
              "Solusi Promosi Terukur 100% di Surakarta",
              "Aktivasi Brand Langsung ke 55.800+ Warga & Pemuda",
              "Publikasi Terluas Didukung 14 Media Partner Regional",
              "Laporan Komprehensif ROI & Monitoring Media",
            ]}
            interval={3200}
            className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate"
          />
        </div>

        {/* Animated Main Title with Responsive Typography */}
        <div className="max-w-4xl mx-auto mb-3 sm:mb-4 px-2">
          <BlurText
            text="Tingkatkan Brand Awareness Anda Bersama 55.800+ Warga Mojosongo."
            delay={35}
            animateBy="words"
            direction="top"
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-title font-extrabold text-n-900 dark:text-white tracking-tight leading-[1.2] sm:leading-[1.12] justify-center text-center"
          />
        </div>

        {/* Responsive Content Writer Copywriting */}
        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-sans leading-relaxed mb-4 sm:mb-6 px-3">
          Koneksikan produk brand Anda langsung ke kelurahan dengan populasi
          terpadat di Kota Surakarta. Didukung sinergi 39 RW, 1 Juta impresi
          bulanan, dan jejaring 14 media partner regional.
        </p>

        {/* Dynamic Highlight rotating text with overflow hidden container */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-n-600 dark:text-n-300 max-w-3xl mx-auto font-sans leading-relaxed mb-6 sm:mb-8 flex-wrap px-2">
          <span className="font-medium">Target penetrasi pasar langsung:</span>
          <div className="inline-flex items-center h-7 px-3 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 overflow-hidden relative">
            <RotatingText
              texts={[
                "55.800+ Warga Mojosongo",
                "1 Juta+ Impresi Instagram",
                "14 Media Partner Terbesar",
                "39 RW Wilayah Mojosongo",
              ]}
              mainClassName="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm leading-none"
              splitLevelClassName="overflow-hidden py-0.5"
              staggerDuration={0.02}
              rotationInterval={2800}
            />
          </div>
        </div>

        {/* Action Buttons using AnimatedShinyButton */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10">
          <AnimatedShinyButton
            url="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship%20Karang%20Taruna%20Mojosongo,%20kami%20ingin%20mendapatkan%20Proposal%20Kemitraan%20dan%20Rate%20Card."
            className="w-full sm:w-auto text-xs sm:text-sm py-3 px-6 sm:px-7 rounded-full font-bold shadow-xl shadow-emerald-600/20"
          >
            Dapatkan Proposal & Rate Card
          </AnimatedShinyButton>

          <a
            href="#paket"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-n-800 dark:text-white font-semibold text-xs sm:text-sm border border-n-200/80 dark:border-white/15 backdrop-blur-xl shadow-xs transition-all"
          >
            <span>Lihat Pilihan Paket Sponsor</span>
          </a>
        </div>

        {/* ── Information Cards using CardFlip (Clean, Modern, Background Icon Mati) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto">
          {/* Card 1: 55.800+ Penduduk */}
          <CardFlip
            className="h-[290px] sm:h-[300px]"
            title="Total Penduduk"
            subtitle="Basis Warga Terpadat"
            description="Target 55.800+ warga aktif."
            badge="Demografi"
            icon={
              <Users className="w-5 h-5 text-slate-800 dark:text-white stroke-[1.6]" />
            }
            features={[
              "55.800+ Jiwa Terdata",
              "Dominasi Usia Produktif",
              "Sampling Produk Langsung",
              "Dukungan Penuh Kelurahan",
            ]}
            ctaText="Konsultasi Demografi"
            ctaLink="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship,%20saya%20ingin%20tahu%20lebih%20banyak%20tentang%20demografi%20Mojosongo."
            frontContent={
              <div className="h-full p-5 sm:p-6 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                  {/* Clean Icon Without Colorful Box (Background Mati) */}
                  <div className="text-slate-800 dark:text-slate-100 flex items-center">
                    <Users className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Demografi
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-title text-slate-900 dark:text-white tracking-tight">
                    <CountUp to={55800} separator="." duration={2.2} />+
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    Total Penduduk
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Kelurahan terpadat di Surakarta.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Arahkan kursor untuk detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            }
          />

          {/* Card 2: 1 Juta+ Impresi Instagram */}
          <CardFlip
            className="h-[290px] sm:h-[300px]"
            title="Instagram Official"
            subtitle="@karangtaruna.mojosongo"
            description="1 Juta impresi bulanan."
            badge="Viral Reach"
            icon={
              <Instagram className="w-5 h-5 text-slate-800 dark:text-white stroke-[1.6]" />
            }
            features={[
              "1.100+ Followers Organik",
              "1 Juta+ Impresi Bulanan",
              "Kolaborasi Konten Reels",
              "Interaksi Harian Tinggi",
            ]}
            ctaText="Buka Instagram Kami"
            ctaLink="https://instagram.com/karangtaruna.mojosongo"
            frontContent={
              <div className="h-full p-5 sm:p-6 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                  {/* Clean Icon Without Colorful Box (Background Mati) */}
                  <div className="text-slate-800 dark:text-slate-100 flex items-center">
                    <Instagram className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Instagram
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-title text-emerald-600 dark:text-emerald-400 tracking-tight">
                    <CountUp to={1} duration={1.5} /> Juta+
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    Impresi Bulanan IG
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Jangkauan viral se-Surakarta.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Arahkan kursor untuk detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            }
          />

          {/* Card 3: 39 RW / 250+ RT */}
          <CardFlip
            className="h-[290px] sm:h-[300px]"
            title="Jangkauan Wilayah"
            subtitle="39 RW & 250+ RT Terpadu"
            description="Koneksi terpadu 39 RW."
            badge="Koneksi Wilayah"
            icon={
              <Building2 className="w-5 h-5 text-slate-800 dark:text-white stroke-[1.6]" />
            }
            features={[
              "Struktur Resmi 39 RW",
              "25 Titik Strategis Baliho",
              "Mobilisasi Komunal Cepat",
              "Koordinasi Wilayah Terpadu",
            ]}
            ctaText="Info Penempatan Titik"
            ctaLink="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship,%20kami%20ingin%20tahu%20titik%20promosi%20di%2039%20RW."
            frontContent={
              <div className="h-full p-5 sm:p-6 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                  {/* Clean Icon Without Colorful Box (Background Mati) */}
                  <div className="text-slate-800 dark:text-slate-100 flex items-center">
                    <Building2 className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Wilayah
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-title text-slate-900 dark:text-white tracking-tight">
                    <CountUp to={39} duration={2} /> RW
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    Jangkauan Wilayah
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Terhubung langsung 250+ RT.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Arahkan kursor untuk detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            }
          />

          {/* Card 4: 14 Media Partner */}
          <CardFlip
            className="h-[290px] sm:h-[300px]"
            title="14 Media Partner"
            subtitle="Ekosistem Terluas Solo Raya"
            description="Jejaring 14 media partner."
            badge="Multi-Kanal"
            icon={
              <Megaphone className="w-5 h-5 text-slate-800 dark:text-white stroke-[1.6]" />
            }
            features={[
              "14 Media Partner Populer",
              "1.5 Juta+ Total Audiens",
              "Liputan Langsung Lokasi",
              "Publikasi Rilis Resmi",
            ]}
            ctaText="Cek Media Partner"
            ctaLink="#media-partner"
            frontContent={
              <div className="h-full p-5 sm:p-6 flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                  {/* Clean Icon Without Colorful Box (Background Mati) */}
                  <div className="text-slate-800 dark:text-slate-100 flex items-center">
                    <Megaphone className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Media Partner
                  </span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-title text-slate-900 dark:text-white tracking-tight">
                    <CountUp to={14} duration={2} />
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    Media Partner Solo
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Publikasi terintegrasi Solo Raya.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Arahkan kursor untuk detail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Media Partner Network with TiltCard ── */}
      <section
        id="media-partner"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10"
      >
        <div className="text-center max-w-3xl mx-auto mb-6 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-[11px] font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ekosistem Publikasi Terluas di Solo Raya</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-title text-slate-900 dark:text-white tracking-tight leading-tight">
            14 Media Partner Siap Mendukung Kampanye Brand Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-sans max-w-xl mx-auto leading-relaxed">
            Setiap sponsor paket Platinum dan Gold mendapatkan fasilitas
            publikasi cross-channel ke akun-akun informasi kota terpopuler:
          </p>
        </div>

        {/* 14 Partners Grid with TiltCard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3 max-w-6xl mx-auto">
          {MEDIA_PARTNERS.map((partner) => (
            <TiltCard
              key={partner.id}
              maxTilt={14}
              scale={1.05}
              glare={true}
              glareOpacity={0.16}
              className="rounded-2xl h-full"
            >
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-xs hover:shadow-md backdrop-blur-xl flex flex-col items-center text-center h-full transition-all duration-300">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500/20 to-emerald-100 shadow-xs mb-1.5">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-white">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {partner.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {partner.followers}
                </span>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── Sponsorship Packages / Tiers with Minimalist GlowHover & TrueFocus ── */}
      <section
        id="paket"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10"
      >
        <div className="text-center max-w-3xl mx-auto mb-8 px-4">
          <div className="flex justify-center mb-2">
            <TrueFocus
              sentence="Paket Kemitraan Eksklusif"
              manualMode={false}
              blurAmount={4}
              borderColor="#10b981"
              glowColor="rgba(16, 185, 129, 0.35)"
              animationDuration={0.4}
              pauseBetweenAnimations={1.5}
            />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-title text-slate-900 dark:text-white tracking-tight mt-1">
            Paket Sponsorship & Keuntungan Eksklusif
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 font-sans max-w-xl mx-auto leading-relaxed">
            Pilihan paket fleksibel sesuai objektif pemasaran brand Anda.
            Arahkan kursor untuk melihat efek interaktif.
          </p>
        </div>

        {/* GlowHover Cards Container */}
        <GlowHover
          items={glowItems}
          glowIntensity={0.16}
          maskSize={420}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-7xl mx-auto items-stretch"
        />
      </section>

      {/* ── Closing Guarantee & WhatsApp CTA Banner with LineByLineSlide & AnimatedShinyButton ── */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-5xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-9 bg-gradient-to-r from-n-900 via-n-900 to-emerald-950 text-white shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Komitmen Sinergi 100% Profesional & Terverifikasi
            </span>

            <LineByLineSlide
              lines={[
                "Siap Memperluas Dampak &",
                "Penjualan Brand Anda di Mojosongo?",
              ]}
              className="text-xl sm:text-2xl md:text-3xl font-title font-bold leading-tight mb-2.5"
              triggerOnView={true}
            />

            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-xl mx-auto mb-6">
              Tim Sponsorship kami siap mendiskusikan penyesuaian paket,
              timeline aktivasi, dan detail kebutuhan promosi Anda secara
              fleksibel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <AnimatedShinyButton
                url="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship%20Karang%20Taruna%20Mojosongo,%20kami%20ingin%20berkonsultasi%20mengenai%20kerjasama%20sponsorship."
                className="w-full sm:w-auto text-xs sm:text-sm py-3 px-6 sm:px-7 rounded-full font-bold shadow-xl shadow-emerald-500/25"
              >
                Konsultasi Langsung via WhatsApp (+62 823-2707-7569)
              </AnimatedShinyButton>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all"
              >
                <span>Eksplorasi Profil Karang Taruna</span>
              </Link>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-xs text-n-400">
              <span>📍 Kelurahan Mojosongo, Jebres, Kota Surakarta</span>
              <a
                href="https://wa.me/6282327077569"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                💬 WA: +62 823-2707-7569
              </a>
              <span>📧 sponsorship@karangtaruna-mojosongo.id</span>
              <span>📱 IG: @karangtaruna.mojosongo</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
