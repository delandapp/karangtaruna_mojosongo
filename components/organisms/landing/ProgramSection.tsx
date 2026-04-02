"use client";

import React, { useRef } from "react";
import { ProgramCard } from "@/components/molecules/ProgramCard";
import ScrollStack, { ScrollStackItem } from "@/components/react-bits/scroll-stack";
import BlurText from "@/components/react-bits/text-blur";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

export function ProgramSection() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const programs = [
    {
      title: "Kegiatan Sosial & Masyarakat",
      subtitle: "Bakti Sosial",
      description: "Berbagi dengan sesama melalui kegiatan donor darah, santunan anak yatim, dan gotong royong warga.",
      image: "https://images.unsplash.com/photo-1593113565694-c68171628116?q=80&w=2070&auto=format&fit=crop",
      href: "/programs/sosial",
      color: "primary" as const,
    },
    {
      title: "Pengembangan Pemuda & Olahraga",
      subtitle: "Kreativitas",
      description: "Peningkatan kapasitas pemuda melalui turnamen olahraga, pelatihan kewirausahaan, dan festival seni.",
      image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2049&auto=format&fit=crop",
      href: "/programs/pengembangan",
      color: "accent" as const,
    },
    {
      title: "Pendidikan & Keterampilan",
      subtitle: "Edukasi",
      description: "Meningkatkan kualitas sdm pemuda pemudi dengan berbagai course dan pelatihan IT.",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop",
      href: "/programs/pendidikan",
      color: "blue" as const,
    }
  ];

  return (
    <section id="program" className="w-full py-24 md:py-40 bg-background relative z-10 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col mb-12 text-center md:text-left">
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-title font-bold text-foreground leading-none">
            <BlurText text="PROGRAM" delay={50} animateBy="letters" />
          </h2>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-title font-bold text-transparent stroke-text outline-text leading-none mt-[-10px] uppercase" style={{ WebkitTextStroke: '1px var(--color-foreground)', color: 'transparent' }}>
             &amp; KEGIATAN
          </h2>
          <p className="text-muted-foreground mt-8 font-body max-w-sm mx-auto md:mx-0">
             Beragam inisiatif kami untuk membangun lingkungan dan memberdayakan potensi pemuda Mojosongo.
          </p>
        </div>

        <div className="w-full h-screen">
          <ScrollStack 
             useWindowScroll={false} 
             baseScale={0.9} 
             itemStackDistance={40} 
             blurAmount={4}
             className="w-full bg-transparent overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
          >
             {programs.map((prog, index) => (
                <ScrollStackItem key={index} itemClassName="!h-auto !p-0 !bg-transparent border-none outline-none shadow-none !my-0">
                  <ProgramCard
                    index={index}
                    title={prog.title}
                    subtitle={prog.subtitle}
                    description={prog.description}
                    image={prog.image}
                    href={prog.href}
                    color={prog.color as any}
                  />
                </ScrollStackItem>
             ))}
          </ScrollStack>
        </div>
      </div>
    </section>
  );
}
