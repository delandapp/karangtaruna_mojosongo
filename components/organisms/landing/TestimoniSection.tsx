"use client";

import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import Image from "next/image";
import { QuoteIcon } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    quote: "Semenjak ada komunitas ini, para pemuda jadi lebih aktif dan kreatif di kampung. Banyak kegiatan positif setiap minggunya.",
    name: "Ibu Sutarti",
    role: "Warga RW 08",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop"
  },
  {
    quote: "Program UMKM pemuda sungguh sangat membantu ekonomi lokal. Saya bangga menjadi bagian dari Mojosongo.",
    name: "Bapak Joko",
    role: "Tokoh Masyarakat",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1287&auto=format&fit=crop"
  },
  {
    quote: "Karang Taruna memberikan ruang buat anak muda menyalurkan hobi. Kami sekarang punya studio musik sendiri hasil kolektif.",
    name: "Andi Pratama",
    role: "Pemuda RW 04",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop"
  }
];

export function TestimoniSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    const getScrollAmount = () => {
      const parentWidth = containerRef.current!.parentElement!.offsetWidth;
      return containerRef.current!.scrollWidth - parentWidth;
    };

    gsap.to(containerRef.current, {
      x: () => -getScrollAmount(),
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        pin: true,
        scrub: 1,
        end: () => "+=" + getScrollAmount()
      }
    });

  }, { scope: sectionRef });

  return (
    <section id="testimoni" ref={sectionRef} className="relative w-full h-[100svh] bg-background text-foreground flex items-center overflow-hidden">
      
      {/* Background Decorative */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 clip-path-slant z-0" />
      <div className="absolute top-10 left-10 opacity-10 z-0">
        <QuoteIcon className="w-64 h-64 text-primary" />
      </div>

      <div className="container relative z-10 max-w-7xl mx-auto px-6 flex flex-col h-full justify-center">
        
        <div className="mb-12 md:mb-20">
          <AnimatedText as="h2" text="KATA MEREKA" variant="clip" className="text-4xl md:text-5xl font-title font-bold drop-shadow-sm" />
          <AnimatedText as="p" text="Dampak nyata yang dirasakan oleh masyarakat" variant="slide-up" delay={0.2} className="text-muted-foreground font-body mt-4 text-lg" />
        </div>

        <div className="w-full relative h-[400px] md:h-[300px]">
          <div ref={containerRef} className="absolute top-0 left-0 flex w-[300%] h-full">
            {testimonials.map((testimoni, idx) => (
              <div key={idx} className="testimoni-slide w-1/3 flex items-center px-4 md:px-12">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start group">
                  
                  {/* Photo */}
                  <div className="relative w-24 h-24 md:w-40 md:h-40 shrink-0 rounded-full overflow-hidden border-4 border-background shadow-xl">
                    <Image src={testimoni.image} alt={testimoni.name} fill className="object-cover" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col flex-1 text-center md:text-left">
                    <div className="text-primary mb-4 hidden md:block">
                      <QuoteIcon className="w-12 h-12" fill="currentColor" />
                    </div>
                    <p className="text-xl md:text-3xl font-body font-medium italic leading-relaxed mb-6 text-foreground/90">
                      &quot;{testimoni.quote}&quot;
                    </p>
                    <div>
                      <h4 className="text-lg font-bold font-title uppercase tracking-widest text-primary">{testimoni.name}</h4>
                      <p className="text-muted-foreground font-body">{testimoni.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
