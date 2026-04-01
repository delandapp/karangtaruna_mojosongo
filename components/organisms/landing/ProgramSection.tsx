"use client";

import React, { useRef } from "react";
import { ProgramCard } from "@/components/molecules/ProgramCard";
import { AnimatedText } from "@/components/atoms/AnimatedText";

export function ProgramSection() {
  const programs = [
    {
      title: "Kegiatan Sosial & Masyarakat",
      subtitle: "Bakti Sosial",
      description: "Berbagi dengan sesama melalui kegiatan donor darah, santunan anak yatim, dan gotong royong warga.",
      image: "https://images.unsplash.com/photo-1593113565694-c68171628116?q=80&w=2070&auto=format&fit=crop", // Placeholder
      href: "/programs/sosial",
      color: "primary" as const,
    },
    {
      title: "Pengembangan Pemuda & Olahraga",
      subtitle: "Kreativitas",
      description: "Peningkatan kapasitas pemuda melalui turnamen olahraga, pelatihan kewirausahaan, dan festival seni.",
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2049&auto=format&fit=crop", // Placeholder
      href: "/programs/pengembangan",
      color: "accent" as const,
    },
  ];

  return (
    <section id="program" className="w-full py-24 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex flex-col">
            <AnimatedText as="h2" text="PROGRAM" className="text-5xl md:text-8xl font-title font-bold text-foreground leading-none" />
            <h2 className="text-5xl md:text-8xl font-title font-bold text-transparent stroke-text outline-text leading-none" style={{ WebkitTextStroke: '1px currentColor', color: 'transparent' }}>
              &amp; KEGIATAN
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm md:text-right font-body">
            Beragam inisiatif kami untuk membangun lingkungan dan memberdayakan potensi pemuda Mojosongo.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {programs.map((prog, index) => (
            <ProgramCard
              key={index}
              index={index}
              title={progi.title}
              subtitle={prog.subtitle}
              description={prog.description}
              image={prog.image}
              href={prog.href}
              color={prog.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
