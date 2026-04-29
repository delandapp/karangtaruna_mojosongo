"use client";

import React, { useEffect } from "react";
import CardNav from "@/components/organisms/cards/NavCard";
import { HeroSection } from "@/components/organisms/landing/HeroSection";
import { SectionIndicator } from "@/components/atoms/SectionIndicator";
import { trackPageView } from "@/lib/analytics";
import { useLenis } from "@/lib/hooks/useLenis";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { CustomCursor } from "@/components/atoms/CustomCursor";

const LANDING_SECTIONS = [
  { id: "hero", label: "Beranda" },
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
      </main>

    </div>
  );
}
