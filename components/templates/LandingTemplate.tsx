"use client";

import React, { useEffect } from "react";
import CardNav from "@/components/organisms/cards/NavCard";
import { HeroSection } from "@/components/organisms/landing/HeroSection";
import { VisionMissionSection } from "@/components/organisms/landing/VisionMissionSection";
import { StatsSection } from "@/components/organisms/landing/StatsSection";
import { ProgramSection } from "@/components/organisms/landing/ProgramSection";
import { YouthSection } from "@/components/organisms/landing/YouthSection";
import { GallerySection } from "@/components/organisms/landing/GallerySection";
import { TestimoniSection } from "@/components/organisms/landing/TestimoniSection";
import { NewsSection } from "@/components/organisms/landing/NewsSection";
import { CTASection } from "@/components/organisms/landing/CTASection";
import { PartnersSection } from "@/components/organisms/landing/PartnersSection";
import { SocialSection } from "@/components/organisms/landing/SocialSection";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { SectionIndicator } from "@/components/atoms/SectionIndicator";
import { trackPageView } from "@/lib/analytics";
import { useLenis } from "@/lib/hooks/useLenis";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { CustomCursor } from "@/components/atoms/CustomCursor";

const LANDING_SECTIONS = [
  { id: "hero", label: "Beranda" },
  { id: "visi-misi", label: "Visi Misi" },
  { id: "stats", label: "Statistik" },
  { id: "program", label: "Program" },
  { id: "pengurus", label: "Pemuda" },
  { id: "galeri", label: "Galeri" },
  { id: "testimoni", label: "Testimoni" },
  { id: "berita", label: "Berita" },
  { id: "cta", label: "Bergabung" },
];

export function LandingTemplate() {
  useLenis(); // Initialize lenis smooth scroll

  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    trackPageView("/");
  }, []);

  const navItems = [
    {
      label: "Program",
      bgColor: "var(--color-primary-500)",
      textColor: "#fff",
      links: [
        { label: "Lihat Semua Program", href: "#program", ariaLabel: "Program" }
      ]
    },
    {
      label: "Berita",
      bgColor: "var(--color-accent-500)",
      textColor: "#fff",
      links: [
        { label: "Kabar Terbaru", href: "#berita", ariaLabel: "Berita" }
      ]
    },
    {
      label: "Galeri",
      bgColor: "var(--color-n-800)",
      textColor: "#fff",
      links: [
        { label: "Dokumentasi Foto", href: "#galeri", ariaLabel: "Galeri" }
      ]
    }
  ];

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground">
      <CustomCursor />
      <SectionIndicator sections={LANDING_SECTIONS} />
      
      <CardNav 
        logo="/image/logo/logo-karang-taruna.png"
        logoAlt="Karang Taruna Mojosongo"
        items={navItems}
        baseColor="var(--color-background)"
        menuColor="var(--color-foreground)"
        buttonBgColor="var(--color-primary-500)"
        buttonTextColor="#ffffff"
        ctaLabel="Bergabung"
      />
      
      <main className="flex flex-col w-full">
        <HeroSection />
        <VisionMissionSection />
        <StatsSection />
        <ProgramSection />
        <YouthSection />
        <GallerySection />
        <TestimoniSection />
        <NewsSection />
        <CTASection />
        <PartnersSection />
        <SocialSection />
      </main>

      <LandingFooter />
    </div>
  );
}
