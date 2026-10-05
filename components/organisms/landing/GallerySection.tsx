"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Images,
  ArrowRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
} from "lucide-react";
import { galleryAlbums, GalleryAlbum } from "@/lib/data/gallery";
import { cn } from "@/lib/utils";

export function GallerySection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [activeModalAlbum, setActiveModalAlbum] = useState<GalleryAlbum | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);

  // Filter albums
  const filteredAlbums =
    selectedCategory === "semua"
      ? galleryAlbums.slice(0, 6)
      : galleryAlbums
          .filter((album) => album.category === selectedCategory || album.id.includes(selectedCategory))
          .slice(0, 6);

  const openLightbox = (album: GalleryAlbum, photoIdx: number = 0) => {
    setActiveModalAlbum(album);
    setActivePhotoIdx(photoIdx);
  };

  const closeLightbox = () => {
    setActiveModalAlbum(null);
    setActivePhotoIdx(0);
  };

  const nextPhoto = () => {
    if (!activeModalAlbum) return;
    const total = activeModalAlbum.photos.length || 1;
    setActivePhotoIdx((prev) => (prev + 1) % total);
  };

  const prevPhoto = () => {
    if (!activeModalAlbum) return;
    const total = activeModalAlbum.photos.length || 1;
    setActivePhotoIdx((prev) => (prev - 1 + total) % total);
  };

  return (
    <section id="galeri" className="relative w-full py-20 sm:py-28 overflow-hidden bg-background">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-emerald-500/5 via-teal-400/5 to-transparent blur-[140px] rounded-full pointer-events-none -z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
              <Camera className="w-3.5 h-3.5" />
              <span>Dokumentasi Kegiatan Nyata</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-title text-n-900 dark:text-white tracking-tight leading-tight">
              Galeri Jejak Karya & Kebersamaan Pemuda
            </h2>
            <p className="text-sm sm:text-base text-n-600 dark:text-n-400 mt-3 font-sans">
              Potret dedikasi, pentas seni budaya, dan aksi sosial Karang Taruna Kelurahan Mojosongo dalam melayani masyarakat.
            </p>
          </div>

          <Link
            href="/galeri"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-white/10 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 border border-n-200/80 dark:border-white/15 text-xs sm:text-sm font-semibold text-n-800 dark:text-white shadow-xs hover:shadow-md transition-all duration-300 self-start md:self-end"
          >
            <span>Buka Arsip Galeri Lengkap</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* ── Category Filter Tabs (iOS Pill Style) ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 sm:mb-10 no-scrollbar">
          {[
            { id: "semua", label: "Semua Album" },
            { id: "turun-kebawah-2026", label: "Turun Kebawah 2026" },
            { id: "merti-desa-mojosongo", label: "Merti Desa Mojosongo" },
            { id: "karawitan-rumah-dinas-walikota", label: "Karawitan Loji Gandrung" },
            { id: "sosial", label: "Bakti Sosial" },
            { id: "seni-budaya", label: "Seni & Budaya" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105"
                  : "bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-n-700 dark:text-n-300 border border-n-200/60 dark:border-white/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Bento Grid Showcase of Albums ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAlbums.map((album, idx) => {
            const isFeaturedLarge = idx === 0 || idx === 1;
            return (
              <div
                key={album.id}
                onClick={() => openLightbox(album)}
                className={cn(
                  "group relative rounded-[2rem] overflow-hidden bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,188,106,0.12)] backdrop-blur-2xl transition-all duration-500 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1.5",
                  isFeaturedLarge && "md:col-span-1"
                )}
              >
                {/* Photo Cover Wrapper */}
                <div className="relative w-full aspect-[16/11] overflow-hidden rounded-t-[1.8rem] bg-n-100 dark:bg-n-800">
                  <Image
                    src={album.cover}
                    alt={album.title}
                    fill
                    loading="lazy"
                    quality={80}
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Subtle top pill tags */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white flex items-center gap-1">
                      <Images className="w-3 h-3 text-emerald-400" />
                      {album.photos.length || album.photoCount} Foto
                    </span>

                    <span className="w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md flex items-center justify-center text-n-800 dark:text-white shadow-xs group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Date and Location Badge Overlay */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center gap-2 text-[11px] font-medium text-white/90">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                      <Calendar className="w-3 h-3 text-emerald-300" />
                      {album.date}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 truncate">
                      <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                      <span className="truncate">{album.location}</span>
                    </span>
                  </div>
                </div>

                {/* Card Info Content */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-title text-n-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                      {album.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-n-600 dark:text-n-400 font-sans line-clamp-2 leading-relaxed">
                      {album.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-n-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Lihat Dokumentasi Lengkap</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Lightbox Modal ── */}
      {activeModalAlbum && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-2xl transition-all duration-300 animate-in fade-in"
          onClick={closeLightbox}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-n-900/90 border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 text-white">
              <div>
                <h3 className="text-lg sm:text-xl font-bold font-title">
                  {activeModalAlbum.title}
                </h3>
                <p className="text-xs text-n-400">
                  {activeModalAlbum.location} • {activeModalAlbum.date}
                </p>
              </div>

              <button
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Tutup Galeri"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-black flex items-center justify-center overflow-hidden">
              {(() => {
                const currentPhoto =
                  activeModalAlbum.photos[activePhotoIdx]?.src || activeModalAlbum.cover;
                const currentAlt =
                  activeModalAlbum.photos[activePhotoIdx]?.alt || activeModalAlbum.title;

                return (
                  <Image
                    src={currentPhoto}
                    alt={currentAlt}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                );
              })()}

              {/* Prev / Next navigation buttons */}
              {activeModalAlbum.photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                    aria-label="Foto Sebelumnya"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md"
                    aria-label="Foto Berikutnya"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Modal Footer Thumbnails */}
            {activeModalAlbum.photos.length > 1 && (
              <div className="flex items-center gap-2 p-4 overflow-x-auto bg-black/40 border-t border-white/10">
                {activeModalAlbum.photos.map((photo, i) => (
                  <button
                    key={photo.src}
                    onClick={() => setActivePhotoIdx(i)}
                    className={cn(
                      "relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                      activePhotoIdx === i
                        ? "border-emerald-500 scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      loading="lazy"
                      quality={60}
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
