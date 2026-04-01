"use client";

import React, { useEffect } from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { HeroSection } from "@/components/organisms/landing/HeroSection";
import { StatsSection } from "@/components/organisms/landing/StatsSection";
import { ProgramSection } from "@/components/organisms/landing/ProgramSection";
import { GallerySection } from "@/components/organisms/landing/GallerySection";
import { CTASection } from "@/components/organisms/landing/CTASection";
import { PartnersSection } from "@/components/organisms/landing/PartnersSection";
import { SocialSection } from "@/components/organisms/landing/SocialSection";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { SectionIndicator } from "@/components/atoms/SectionIndicator";
import { trackPageView } from "@/lib/analytics";

const LANDING_SECTIONS = [
  { id: "hero", label: "Beranda" },
  { id: "stats", label: "Statistik" },
  { id: "program", label: "Program" },
  { id: "galeri", label: "Galeri" },
  { id: "cta", label: "Bergabung" },
  { id: "mitra", label: "Mitra" },
  { id: "social", label: "Sosial Media" },
];

export function LandingTemplate() {
  useEffect(() => {
    trackPageView("/");
    // Setup smoother scroll if premium plugin, otherwise standard smooth scroll behavior
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-x-hidden">
      <SectionIndicator sections={LANDING_SECTIONS} />
      
      <LandingNavbar />
      
      <main className="flex flex-col w-full">
        <HeroSection />
        <StatsSection />
        <ProgramSection />
        <GallerySection />
        <CTASection />
        <PartnersSection />
        <SocialSection />
      </main>

      <LandingFooter />
    </div>
  );
}
