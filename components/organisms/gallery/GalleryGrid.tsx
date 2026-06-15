"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Images, ZoomIn } from "lucide-react";
import {
  galleryAlbums,
  galleryCategories,
  filterAlbumsByCategory,
  GalleryCategory,
  GalleryAlbum,
} from "@/lib/data/gallery";
import { GalleryAlbumCarousel } from "@/components/organisms/gallery/GalleryAlbumCarousel";
import { cn } from "@/lib/utils";

// Tab aktif: primary-500 untuk semua / sosial, accent-500 untuk pendidikan/seni
const categoryColorMap: Record<GalleryCategory, string> = {
  semua:        "bg-primary-500 text-white shadow-primary-500/25",
  sosial:       "bg-primary-600 text-white shadow-primary-600/25",
  pendidikan:   "bg-accent-500 text-white shadow-accent-500/25",
  "seni-budaya":"bg-n-700 dark:bg-n-200 text-white dark:text-n-900",
};

// Badge di atas card
const categoryBadgeMap: Record<GalleryCategory, string> = {
  semua:        "bg-primary-500/20 text-primary-300 border-primary-500/30",
  sosial:       "bg-primary-500/20 text-primary-300 border-primary-500/30",
  pendidikan:   "bg-accent-500/20 text-accent-300 border-accent-500/30",
  "seni-budaya":"bg-n-700/40 text-n-200 border-n-500/30",
};

const categoryLabelMap: Record<string, string> = {
  sosial:       "Sosial",
  pendidikan:   "Pendidikan",
  "seni-budaya":"Seni & Budaya",
};

// Stagger animation container
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as any },
  },
};

// ─────────────────────────────────────────────────────────
// Album Card Component
// ─────────────────────────────────────────────────────────
function AlbumCard({
  album,
  onClick,
}: {
  album: GalleryAlbum;
  onClick: (album: GalleryAlbum) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      variants={cardVariants}
      className="group relative cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(album)}
    >
      {/* Cover Image */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
        <Image
          src={album.cover}
          alt={album.title}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            isHovered ? "scale-110" : "scale-100"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient Overlay */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
            isHovered ? "opacity-100" : "opacity-70"
          )}
        />

        {/* Category Badge – top left */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "text-[10px] font-ui font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
              categoryBadgeMap[album.category],
              "backdrop-blur-md"
            )}
          >
            {categoryLabelMap[album.category]}
          </span>
        </div>

        {/* Photo count badge – top right */}
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full text-[10px] font-ui font-semibold">
            <Images className="w-3 h-3" />
            {album.photoCount} foto
          </div>
        </div>

        {/* Hover Zoom Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
            <ZoomIn className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        {/* Bottom text */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="text-white font-title font-bold text-base md:text-lg leading-tight drop-shadow-lg line-clamp-2 mb-2">
            {album.title}
          </h3>
          <div className="flex items-center gap-3 text-white/70 text-xs font-ui">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {album.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {album.location}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────────────────
// GalleryGrid – main export
// ─────────────────────────────────────────────────────────
export function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("semua");
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);

  const filteredAlbums = filterAlbumsByCategory(galleryAlbums, activeCategory);

  const handleOpenAlbum = (album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setIsCarouselOpen(true);
  };

  const handleCloseCarousel = () => {
    setIsCarouselOpen(false);
    setTimeout(() => setSelectedAlbum(null), 300);
  };

  return (
    <section className="w-full">

      {/* ── Section Header (mengikuti gaya HeroSection) ── */}
      <div className="mb-10 md:mb-12">
        <p className="text-n-500 dark:text-n-400 font-ui text-sm uppercase tracking-widest font-semibold mb-2">
          Semua Dokumentasi
        </p>
        <h2 className="text-3xl md:text-4xl font-title font-bold text-n-900 dark:text-n-50 leading-tight">
          Album{" "}
          <span className="text-accent-500">Kegiatan</span>
        </h2>
        <p className="text-n-600 dark:text-n-400 font-body mt-2 max-w-xl">
          Klik album untuk melihat foto-foto dokumentasi lengkap setiap kegiatan.
        </p>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap mb-8 md:mb-10">
        {galleryCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-ui font-semibold transition-all duration-300",
              activeCategory === cat.value
                ? cn(categoryColorMap[cat.value], "shadow-lg scale-105")
                : "bg-n-100 dark:bg-n-800 text-n-600 dark:text-n-400 hover:bg-n-200 dark:hover:bg-n-700 hover:scale-105"
            )}
          >
            {cat.label}
            {cat.value !== "semua" && (
              <span className="ml-2 text-[10px] opacity-70">
                ({filterAlbumsByCategory(galleryAlbums, cat.value).length})
              </span>
            )}
          </button>
        ))}

        {/* Total count */}
        <span className="ml-auto text-sm font-ui text-n-500 dark:text-n-400">
          {filteredAlbums.length} album
        </span>
      </div>

      {/* ── Grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {filteredAlbums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onClick={handleOpenAlbum}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filteredAlbums.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <Images className="w-12 h-12 text-n-300 dark:text-n-600 mb-4" />
          <p className="text-n-500 dark:text-n-400 font-ui">
            Belum ada dokumentasi untuk kategori ini.
          </p>
        </motion.div>
      )}

      {/* ── Carousel Lightbox ── */}
      {selectedAlbum && (
        <GalleryAlbumCarousel
          album={selectedAlbum}
          isOpen={isCarouselOpen}
          onClose={handleCloseCarousel}
        />
      )}
    </section>
  );
}
