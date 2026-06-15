"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  Images,
} from "lucide-react";
import { GalleryAlbum } from "@/lib/data/gallery";
import { cn } from "@/lib/utils";

interface GalleryAlbumCarouselProps {
  album: GalleryAlbum;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal carousel foto album.
 * Background: blur transparan (bukan solid hitam).
 * Klik di area luar / backdrop → tutup otomatis.
 */
export function GalleryAlbumCarousel({
  album,
  isOpen,
  onClose,
}: GalleryAlbumCarouselProps) {
  const allPhotos = [
    { src: album.cover, alt: `Cover – ${album.title}` },
    ...album.photos,
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Reset ke slide pertama setiap kali album berubah / dibuka
  useEffect(() => {
    if (isOpen) setActiveIndex(0);
  }, [isOpen, album.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, activeIndex]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % allPhotos.length);
  }, [allPhotos.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + allPhotos.length) % allPhotos.length);
  }, [allPhotos.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const delta = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) delta > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop: blur transparan, klik untuk tutup ── */}
          <motion.div
            key="carousel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[190] bg-n-900/60 backdrop-blur-md"
            onClick={onClose}
            aria-label="Tutup galeri"
          />

          {/* ── Modal Panel ── */}
          <motion.div
            key="carousel-modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed z-[200] flex flex-col",
              // Full screen di mobile, centered panel di desktop
              "inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-[90vw] md:max-w-5xl md:h-[88vh] md:rounded-3xl",
              "bg-n-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden"
            )}
            // Hentikan propagasi agar klik di dalam panel tidak menutup modal
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-start justify-between p-4 md:p-5 shrink-0 border-b border-white/10">
              <div className="flex flex-col gap-1">
                <h2 className="text-n-50 font-title font-bold text-lg md:text-xl leading-tight">
                  {album.title}
                </h2>
                <div className="flex items-center gap-4 text-n-400 text-xs font-ui flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent-400" />
                    {album.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-400" />
                    {album.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-n-400" />
                    {activeIndex + 1} / {allPhotos.length}
                  </span>
                </div>
              </div>

              {/* Tombol tutup */}
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-n-200 hover:text-white transition-all border border-white/10 ml-4"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Main Image Viewer ── */}
            <div
              className="flex-1 relative flex items-center justify-center px-4 pb-2 overflow-hidden min-h-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 0.97, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.97, x: -30 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="relative w-full h-full max-h-[58vh] md:max-h-full"
                >
                  <Image
                    src={allPhotos[activeIndex].src}
                    alt={allPhotos[activeIndex].alt}
                    fill
                    className="object-contain drop-shadow-xl"
                    sizes="(max-width: 768px) 100vw, 80vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Prev / Next Buttons */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-3 md:left-5 p-3 rounded-full bg-n-900/50 hover:bg-n-800/70 text-white transition-all hover:scale-110 border border-white/15 backdrop-blur-sm"
                    aria-label="Foto sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-3 md:right-5 p-3 rounded-full bg-n-900/50 hover:bg-n-800/70 text-white transition-all hover:scale-110 border border-white/15 backdrop-blur-sm"
                    aria-label="Foto berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* ── Thumbnail Strip ── */}
            {allPhotos.length > 1 && (
              <div className="shrink-0 px-4 md:px-5 pb-4 md:pb-5 pt-2 border-t border-white/10">
                <div className="flex gap-2 overflow-x-auto scrollbar-none py-1 justify-center">
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={cn(
                        "relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200",
                        "w-16 h-12 md:w-20 md:h-14",
                        idx === activeIndex
                          ? "ring-2 ring-primary-500 scale-105 opacity-100"
                          : "opacity-40 hover:opacity-70 hover:scale-105"
                      )}
                      aria-label={`Lihat foto ${idx + 1}`}
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
