"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Calendar, MapPin, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryAlbums } from "@/lib/data/gallery";
import { cn } from "@/lib/utils";
import BlurText from "@/components/react-bits/text-blur";

gsap.registerPlugin(ScrollTrigger);

// Hanya tampilkan 4 album terbaru di landing page
const FEATURED_ALBUMS = galleryAlbums.slice(0, 4);

// ──────────────────────────────────────────────
export function GallerySection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const containerRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Header fade-in
    gsap.fromTo(
      headerRef.current,
      { y: 36, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      }
    );

    // Gallery cards stagger
    if (galleryRef.current) {
      gsap.fromTo(
        Array.from(galleryRef.current.children),
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.75, stagger: 0.12,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top 85%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    // Footer line
    gsap.fromTo(
      footerRef.current,
      { opacity: 0, x: -30 },
      {
        opacity: 1, x: 0, duration: 0.8, delay: 0.5, ease: "power2.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          toggleActions: "play reverse play reverse",
        },
      }
    );
  }, { scope: containerRef });

  // Mobile: prev / next
  const goNext = () =>
    setCurrentSlide((i) => (i + 1) % FEATURED_ALBUMS.length);
  const goPrev = () =>
    setCurrentSlide((i) => (i - 1 + FEATURED_ALBUMS.length) % FEATURED_ALBUMS.length);

  return (
    <section
      id="galeri"
      ref={containerRef}
      className="relative w-full py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      {/* ── Background decorative elements ── */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-500/5 blur-[100px] pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent-500/5 blur-[80px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Section Header ── */}
        <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            {/* Pill label */}
            <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-ui font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Images className="w-3.5 h-3.5" />
              Dokumentasi Kegiatan
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-title font-bold text-n-900 dark:text-n-50 leading-tight">
              <BlurText 
                text="Galeri"
                delay={50}
                animateBy="words"
                direction="top"
                className="inline-block mr-3"
              />
              <BlurText 
                text="Kegiatan"
                delay={50}
                animateBy="words"
                direction="top"
                className="inline-block text-accent-500"
              />
            </h2>
            <p className="text-n-600 dark:text-n-400 font-body text-lg md:text-xl max-w-xl mt-3 leading-relaxed">
              Jelajahi momen-momen kebersamaan dan inisiatif nyata Karang Taruna
              Kelurahan Mojosongo dalam membangun lingkungan yang lebih baik.
            </p>
          </div>

          {/* CTA link to full gallery */}
          <Link
            href="/galeri"
            className="group inline-flex items-center gap-2.5 bg-n-900 dark:bg-n-50 text-n-50 dark:text-n-900 px-6 py-3 rounded-full font-ui font-semibold text-sm hover:bg-primary-500 dark:hover:bg-primary-500 dark:hover:text-white transition-all duration-300 shadow-md hover:shadow-primary-500/25 hover:scale-105 self-start md:self-auto whitespace-nowrap"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* ── Gallery: Desktop Accordion / Mobile Carousel ── */}
        <div className="relative">

          {/* ── DESKTOP: Accordion / Hover-Expand Layout ── */}
          <div
            ref={galleryRef}
            className={cn(
              "hidden md:flex gap-4 h-[480px] lg:h-[560px]",
            )}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {FEATURED_ALBUMS.map((album, index) => {
              const isExpanded = hoveredIndex !== null
                ? hoveredIndex === index
                : index === 0;

              return (
                <motion.div
                  key={album.id}
                  className="relative rounded-3xl overflow-hidden cursor-pointer shadow-xl flex-shrink-0"
                  onMouseEnter={() => setHoveredIndex(index)}
                  animate={{
                    width: isExpanded ? "48%" : "17.3%",
                  }}
                  transition={{ type: "spring", stiffness: 240, damping: 28 }}
                  onClick={() => window.location.href = "/galeri"}
                >
                  {/* Cover Image */}
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    className={cn(
                      "object-cover transition-transform duration-700",
                      isExpanded ? "scale-105" : "scale-100"
                    )}
                    sizes="(max-width: 1280px) 50vw, 40vw"
                  />

                  {/* Dark overlay */}
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    isExpanded
                      ? "bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                      : "bg-black/50"
                  )} />

                  {/* Top badges (only visible when expanded) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute top-5 left-5 right-5 z-10 flex items-center justify-between"
                      >
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3.5 py-1.5 rounded-full text-xs font-ui font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {album.date}
                        </div>
                        <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3.5 py-1.5 rounded-full text-xs font-ui font-semibold flex items-center gap-1.5">
                          <Images className="w-3 h-3" />
                          {album.photoCount} foto
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.3 }}
                          className="mb-2"
                        >
                          <p className="text-white/70 text-xs font-ui flex items-center gap-1.5 mb-1">
                            <MapPin className="w-3 h-3" />
                            {album.location}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="bg-white/15 backdrop-blur-xl border border-white/25 p-3.5 rounded-2xl shadow-lg">
                      <span className="text-white/70 text-[10px] uppercase tracking-[0.18em] font-ui font-bold block mb-1">
                        Galeri Kegiatan
                      </span>
                      <h3 className={cn(
                        "text-white font-title font-bold leading-snug drop-shadow-sm",
                        isExpanded ? "text-base md:text-lg" : "text-xs line-clamp-2"
                      )}>
                        {album.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── MOBILE: Snap Carousel ── */}
          <div className="md:hidden relative">
            <div className="overflow-hidden rounded-3xl aspect-[4/3]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={FEATURED_ALBUMS[currentSlide].cover}
                    alt={FEATURED_ALBUMS[currentSlide].title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Mobile badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-[11px] font-ui font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {FEATURED_ALBUMS[currentSlide].date}
                    </div>
                    <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1.5 rounded-full text-[11px] font-ui font-semibold flex items-center gap-1.5">
                      <Images className="w-3 h-3" />
                      {FEATURED_ALBUMS[currentSlide].photoCount} foto
                    </div>
                  </div>

                  {/* Mobile bottom info */}
                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <div className="bg-white/15 backdrop-blur-xl border border-white/25 p-4 rounded-2xl shadow-lg">
                      <span className="text-white/70 text-[10px] uppercase tracking-widest font-ui font-bold block mb-1">
                        Galeri Kegiatan
                      </span>
                      <h3 className="text-white font-title font-bold text-base leading-snug">
                        {FEATURED_ALBUMS[currentSlide].title}
                      </h3>
                      <p className="text-white/60 text-xs font-ui mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {FEATURED_ALBUMS[currentSlide].location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mobile Prev / Next */}
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md border border-white/30 text-white p-2.5 rounded-full shadow-lg hover:bg-white/30 transition-colors"
              aria-label="Sebelumnya"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-md border border-white/30 text-white p-2.5 rounded-full shadow-lg hover:bg-white/30 transition-colors"
              aria-label="Berikutnya"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Mobile dot indicators */}
            <div className="flex justify-center gap-1.5 mt-4">
              {FEATURED_ALBUMS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === currentSlide
                      ? "w-6 h-2 bg-primary-500"
                      : "w-2 h-2 bg-n-300 dark:bg-n-600"
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer: Progress bar + "Lihat Galeri Lengkap" ── */}
        <div ref={footerRef} className="mt-10 md:mt-14 flex flex-col sm:flex-row items-center gap-6">
          {/* Progress indicator */}
          <div className="flex-1 h-[2px] bg-n-200 dark:bg-n-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
              initial={{ width: "0%" }}
              whileInView={{ width: `${(FEATURED_ALBUMS.length / galleryAlbums.length) * 100}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-sm font-ui text-n-500 dark:text-n-400 border border-n-200 dark:border-n-700 px-4 py-1.5 rounded-full">
              {FEATURED_ALBUMS.length} dari {galleryAlbums.length} album
            </span>
            <Link
              href="/galeri"
              className="group flex items-center gap-2 text-sm font-ui font-semibold text-primary-600 dark:text-primary-400 hover:text-accent-500 transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
