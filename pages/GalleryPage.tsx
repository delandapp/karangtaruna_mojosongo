"use client";

import React from "react";
import CardNav from "@/components/organisms/cards/NavCard";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { GalleryHero } from "@/components/organisms/gallery/GalleryHero";
import { GalleryGrid } from "@/components/organisms/gallery/GalleryGrid";

/**
 * GalleryPage — Halaman penuh Galeri Kegiatan
 * Menggunakan CardNav yang sama dengan LandingTemplate untuk konsistensi.
 */
export default function GalleryPage() {
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
        { label: "Kabar Terbaru", href: "/#berita", ariaLabel: "Berita" },
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

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar — sama persis dengan LandingTemplate */}
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

      {/* Hero Section */}
      <GalleryHero />

      {/* Gallery Grid with Category Filter */}
      <main className="flex-1 container mx-auto px-6 py-14 md:py-20">
        <GalleryGrid />
      </main>

      <LandingFooter />
    </div>
  );
}
