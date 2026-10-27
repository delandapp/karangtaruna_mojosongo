"use client";

import React, { useEffect } from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { HeroSection } from "@/components/organisms/landing/HeroSection";
import { MediaPartnerSection } from "@/components/organisms/landing/MediaPartnerSection";
import { GallerySection } from "@/components/organisms/landing/GallerySection";
import { FeatureSection } from "@/components/organisms/landing/FeatureSection";
import { SponsorshipSection } from "@/components/organisms/landing/SponsorshipSection";
import { CtaSection } from "@/components/organisms/landing/CtaSection";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { SectionIndicator } from "@/components/atoms/SectionIndicator";
import { trackPageView } from "@/lib/analytics";
import { useLenis } from "@/lib/hooks/useLenis";

const LANDING_SECTIONS = [
  { id: "hero", label: "Beranda" },
  { id: "mitra", label: "Media Partner" },
  { id: "galeri", label: "Galeri Dokumentasi" },
  { id: "fitur", label: "Program Kerja" },
  { id: "sponsorship", label: "Sponsorship" },
  { id: "cta", label: "Kolaborasi" },
];

export function LandingTemplate() {
  useLenis(); // Initialize lenis smooth scroll

  useEffect(() => {
    trackPageView("/");
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-[#06080d] text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-emerald-500 selection:text-white overflow-x-clip">
      {/* Floating Section Progress Indicator */}
      <SectionIndicator sections={LANDING_SECTIONS} />

      {/* Floating iOS 27 Glassmorphic Navbar */}
      <LandingNavbar />

      <main className="flex flex-col w-full relative z-10">
        {/* 1. Hero Section (iOS 27 glassmorphic aesthetic, floating metrics & dynamic cards) */}
        <section id="hero" className="w-full">
          <HeroSection />
        </section>

        {/* 2. Media Partner Section (14 official collaborated media partners infinite ticker) */}
        <section id="mitra" className="w-full">
          <MediaPartnerSection />
        </section>

        {/* 3. Gallery Section (Dokumentasi Turun Kebawah 2026, Merti Desa, Karawitan Walikota) */}
        <section id="galeri" className="w-full">
          <GallerySection />
        </section>

        {/* 4. Youth Feature & Community Program */}
        <section id="fitur" className="w-full">
          <FeatureSection />
        </section>

        {/* 5. Sponsorship Highlights & Demographic Data */}
        <section id="sponsorship" className="w-full">
          <SponsorshipSection />
        </section>

        {/* 6. Collaboration CTA */}
        <section id="cta" className="w-full">
          <CtaSection />
        </section>
      </main>

      {/* Modern Footer with complete links & official social handles */}
      <LandingFooter />
    </div>
  );
}
