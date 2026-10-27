"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import BorderBeam from "@/components/smoothui/border-beam";
import GlassCard from "@/components/smoothui/glass-card";
import LineByLineSlide from "@/components/smoothui/line-by-line-slide";
import FadeThrough from "@/components/smoothui/fade-through";
import KineticCenterBuild from "@/components/smoothui/kinetic-center-build";
import CountUp from "@/components/react-bits/text-count";

const HERO_SLIDES = [
  {
    id: "merti-desa",
    title: "Merti Desa Mojosongo 2026",
    category: "Pelestarian Seni & Budaya Tradisi",
    stat: "1 Juta+ Impresi",
    image: "/gallery/merti-desa-mojosongo/cover.JPG",
    caption: "Semangat gotong royong dan pelestarian budaya luhur Kelurahan Mojosongo.",
  },
  {
    id: "turun-kebawah",
    title: "Sambang Warga Turun Kebawah",
    category: "Bakti Sosial & Advokasi Pemuda",
    stat: "39 RW Terjangkau",
    image: "/gallery/turun-kebawah-2026/cover.jpg",
    caption: "Menjangkau langsung kebutuhan masyarakat pemuda di tiap sudut RW se-Mojosongo.",
  },
  {
    id: "karawitan",
    title: "Karawitan Loji Gandrung",
    category: "Pentas Rumah Dinas Walikota",
    stat: "Pentas Bergengsi",
    image: "/gallery/karawitan-rumah-dinas-walikota/cover.JPG",
    caption: "Gamelan dan tembang adiluhung pemuda Mojosongo di panggung resmi kota.",
  },
  {
    id: "kirab-tradisi",
    title: "Kirab Tradisi Merti Desa",
    category: "Pesta Budaya Rakyat Komunal",
    stat: "55.800+ Warga",
    image: "/gallery/merti-desa-mojosongo/dokumentasi merti desa mojosongo (1).JPG",
    caption: "Kirab budaya menyatukan ribuan warga lintas RW dalam kerukunan guyub rukun.",
  },
  {
    id: "sinergi-pemuda",
    title: "Aksi Sinergi Generasi Muda",
    category: "Pemberdayaan Karang Taruna",
    stat: "1.100+ Pemuda Aktif",
    image: "/gallery/turun-kebawah-2026/dokumentasi turun kebawah 2026 (1).jpg",
    caption: "Kekuatan persatuan pemuda sebagai penggerak kemajuan Mojosongo masa depan.",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <section
      id="hero"
      className="relative w-full pt-20 sm:pt-28 lg:pt-32 pb-10 sm:pb-14 overflow-hidden"
    >
      {/* ── Minimalist iOS Ambient Light Field ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[480px] bg-gradient-to-b from-emerald-500/10 via-emerald-400/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Top Hero Grid (Headline + Visual Showcase) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center mb-10 sm:mb-12">
          {/* Left Column: Typography & Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Minimalist iOS Capsule with FadeThrough */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-xl mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-wide font-sans">
                Karang Taruna Mojosongo
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <FadeThrough
                phrases={[
                  "Pelestarian Budaya",
                  "Aksi Sosial 39 RW",
                  "Kemitraan Terukur",
                  "Pemuda Berdaya",
                ]}
                interval={2600}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-sans"
              />
            </div>

            {/* Apple-style Staggered Headline using LineByLineSlide */}
            <LineByLineSlide
              lines={["Generasi muda bergerak,", "Membangun Mojosongo."]}
              delay={80}
              stagger={140}
              className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-sans font-bold tracking-tight text-slate-900 dark:text-white leading-[1.06] mb-4"
            />

            {/* Crisp Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-sans max-w-2xl leading-relaxed mb-3">
              Wadah sinergi pemuda terpadu di 39 Rukun Warga Kelurahan Mojosongo. Melestarikan seni budaya adiluhung, menggerakkan aksi sosial, dan membuka kolaborasi sponsor terukur.
            </p>

            {/* Kinetic Center Build Apple Keynote Phrase Reveal */}
            <div className="flex items-center gap-2 mb-6 sm:mb-8 text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <KineticCenterBuild
                phrases={[
                  "Bersinergi Nyata Membangun Mojosongo",
                  "Melestarikan Seni Budaya Adiluhung",
                  "Aksi Sosial Terpadu di 39 RW",
                  "Inovasi Pemuda Mandiri dan Berdaya",
                ]}
                interval={2800}
                className="justify-start font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/sponsorship"
                className="group inline-flex items-center justify-center gap-3 w-full sm:w-auto px-7 py-3.5 rounded-full bg-slate-900 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-slate-900/10 dark:shadow-emerald-600/20 transition-all duration-300 hover:scale-102"
              >
                <span>Bermitra Sponsorship</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>

              <Link
                href="#galeri"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-800 dark:text-white font-medium text-sm border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-xs transition-all duration-200"
              >
                <span>Lihat Dokumentasi Kegiatan</span>
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 w-full sm:w-auto">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="relative w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-slate-100">
                  <Image
                    src="/gallery/turun-kebawah-2026/cover.jpg"
                    alt="Turun Kebawah 2026"
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
                <div className="relative w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-slate-100">
                  <Image
                    src="/gallery/merti-desa-mojosongo/cover.JPG"
                    alt="Merti Desa"
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
                <div className="relative w-7 h-7 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-slate-100">
                  <Image
                    src="/gallery/karawitan-rumah-dinas-walikota/cover.JPG"
                    alt="Karawitan"
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                <strong className="text-slate-900 dark:text-white font-semibold">
                  55.800+ Warga
                </strong>{" "}
                • 39 RW se-Kelurahan Mojosongo
              </p>
            </div>
          </div>

          {/* Right Column: Hero Visual Card with 5-Events Cycling Slideshow (5 cols) */}
          <div
            className="lg:col-span-5 relative flex justify-center w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <BorderBeam
              radius={36}
              duration={8}
              size={96}
              borderWidth={1.5}
              colorFrom="#10b981"
              colorTo="#059669"
              className="w-full max-w-[440px] sm:max-w-[480px] rounded-[2.25rem] shadow-2xl p-2 bg-white/60 dark:bg-[#0c101b]/70 backdrop-blur-2xl border border-white/80 dark:border-white/10"
            >
              <div className="relative w-full aspect-[4/5] rounded-[1.85rem] overflow-hidden bg-slate-100 dark:bg-slate-800">
                {/* Cross-fading 5 Images */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={activeSlide.image}
                      alt={activeSlide.title}
                      fill
                      priority
                      quality={85}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 460px"
                      className="object-cover object-center"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                {/* Floating Top Glass Capsule */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] font-semibold text-slate-900 dark:text-white truncate max-w-[170px] sm:max-w-[200px]">
                      {activeSlide.category}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-xl text-white text-[11px] font-bold shadow-xs">
                    {activeSlide.stat}
                  </div>
                </div>

                {/* Bottom Floating Glass Card with Dynamic Details - Translucent glass blending with background photo */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-4 rounded-2xl bg-white/20 dark:bg-black/40 backdrop-blur-2xl border border-white/35 dark:border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.2)] text-white z-10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs uppercase tracking-wider text-emerald-300 font-bold truncate drop-shadow-xs">
                      {activeSlide.title}
                    </p>
                    <span className="text-[10px] text-white/95 font-mono font-bold bg-white/25 dark:bg-white/15 px-2 py-0.5 rounded-full border border-white/30 shadow-xs backdrop-blur-md">
                      0{currentSlide + 1} / 0{HERO_SLIDES.length}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/95 leading-snug line-clamp-2 drop-shadow-xs">
                    {activeSlide.caption}
                  </p>

                  {/* 5 Slide Indicator Dots */}
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/20">
                    {HERO_SLIDES.map((slide, i) => (
                      <button
                        key={slide.id}
                        onClick={() => setCurrentSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentSlide === i
                            ? "w-6 bg-emerald-400 shadow-xs shadow-emerald-400/50"
                            : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Manual Navigation Arrows */}
                <button
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? HERO_SLIDES.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all z-20"
                  aria-label="Slide Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all z-20"
                  aria-label="Slide Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </BorderBeam>
          </div>
        </div>

        {/* ── High-Contrast Minimalist Stat Summary Row with CountUp ── */}
        <div className="w-full rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-5 sm:p-6 mb-8 sm:mb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-200/60 dark:divide-white/10">
            {/* Stat 1: 1 Juta Impresi */}
            <div className="flex flex-col items-center text-center px-4 pt-2 md:pt-0">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline">
                <CountUp to={1} duration={2} />
                <span>&nbsp;Juta+</span>
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Impresi Bulanan Instagram
              </span>
            </div>

            {/* Stat 2: 1.100 Followers */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline">
                <CountUp to={1100} duration={2.5} separator="." />
                <span>+</span>
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Pengikut Aktif Instagram
              </span>
            </div>

            {/* Stat 3: 39 RW */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-slate-900 dark:text-white tracking-tight flex items-baseline">
                <CountUp to={39} duration={2} />
                <span>&nbsp;RW</span>
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Rukun Warga se-Mojosongo
              </span>
            </div>

            {/* Stat 4: 14 Media Partner */}
            <div className="flex flex-col items-center text-center px-4 pt-4 md:pt-0">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                <CountUp to={14} duration={1.8} />
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                Media Partner Kolaborasi Solo
              </span>
            </div>
          </div>
        </div>

        {/* ── 3 Simple Glass Feature Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <GlassCard
            radius={28}
            blur={14}
            className="flex flex-col justify-between p-7 bg-white/75 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none transition-all"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pilar 01
              </span>
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1 mb-2">
                Aksi Sosial & Turun Kebawah
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed mb-6">
                Sambang warga terpadu, bakti sosial, edukasi generasi muda, dan
                advokasi kebutuhan di 39 Rukun Warga.
              </p>
            </div>
            <Link
              href="#galeri"
              className="inline-flex items-center justify-between w-full pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
            >
              <span>Dokumentasi Kegiatan</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard
            radius={28}
            blur={14}
            className="flex flex-col justify-between p-7 bg-white/75 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none transition-all"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pilar 02
              </span>
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1 mb-2">
                Seni Budaya & Tradisi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed mb-6">
                Pelestarian adat tradisi Merti Desa hingga pementasan Sanggar
                Karawitan di Rumah Dinas Walikota Surakarta.
              </p>
            </div>
            <Link
              href="#galeri"
              className="inline-flex items-center justify-between w-full pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
            >
              <span>Eksplorasi Galeri Budaya</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard
            radius={28}
            blur={14}
            className="flex flex-col justify-between p-7 bg-white/75 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-none transition-all"
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pilar 03
              </span>
              <h3 className="text-xl font-bold font-sans text-slate-900 dark:text-white mt-1 mb-2">
                Kemitraan & Sponsorship
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed mb-6">
                Peluang kolaborasi promosi brand strategis dengan capaian 1 Juta
                impresi bulanan dan 14 media partner aktif.
              </p>
            </div>
            <Link
              href="/sponsorship"
              className="inline-flex items-center justify-between w-full pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline group"
            >
              <span>Ajukan Kemitraan</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
