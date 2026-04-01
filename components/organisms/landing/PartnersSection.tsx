"use client";

import React from "react";
import Image from "next/image";
import { MarqueeStrip } from "@/components/molecules/MarqueeStrip";
import { AnimatedText } from "@/components/atoms/AnimatedText";

export function PartnersSection() {
  const partners = [
    { name: "Pemkot Surakarta", logo: "/image/logo/logo_pemkot.png" },
    { name: "Bank Jateng", logo: "/image/logo/logo_pemkot.png" }, // Placeholder duplicated for effect
    { name: "Sponsor 1", logo: "/image/logo/logo_pemkot.png" },
    { name: "Sponsor 2", logo: "/image/logo/logo_pemkot.png" },
    { name: "Sponsor 3", logo: "/image/logo/logo_pemkot.png" },
  ];

  return (
    <section id="mitra" className="w-full py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <AnimatedText as="h2" text="MITRA" className="text-4xl md:text-7xl font-title font-bold text-foreground leading-tight" />
          <h2 className="text-4xl md:text-7xl font-title font-bold text-transparent" style={{ WebkitTextStroke: '1px currentColor' }}>
            &KERJA SAMA
          </h2>
        </div>
        <p className="max-w-md text-muted-foreground font-body">
          Kolaborasi dan dukungan dari berbagai instansi pemerintah maupun swasta dalam mewujudkan program kerja kepemudaan.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Row 1 -> Left */}
        <MarqueeStrip direction="left" speed={60}>
          {partners.map((p, i) => (
            <div key={i} className="flex items-center justify-center w-64 h-32 px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
               {/* Use text instead of image if image is missing to prevent broken layouts */}
              <div className="text-2xl font-bold text-foreground/50 whitespace-nowrap">{p.name.toUpperCase()}</div>
            </div>
          ))}
        </MarqueeStrip>

        {/* Row 2 -> Right */}
        <MarqueeStrip direction="right" speed={50}>
          {[...partners].reverse().map((p, i) => (
            <div key={i} className="flex items-center justify-center w-64 h-32 px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 border border-border/50 rounded-2xl mx-4">
              <div className="text-xl font-bold text-foreground/80 whitespace-nowrap flex items-center gap-4">
                 <div className="w-4 h-4 rounded-full bg-primary" />
                 {p.name}
              </div>
            </div>
          ))}
        </MarqueeStrip>
      </div>
    </section>
  );
}
