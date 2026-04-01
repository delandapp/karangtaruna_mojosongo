"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { useGsapReveal, useGsapParallax } from "@/lib/hooks/useGsapAnimation";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { ArrowDown } from "lucide-react";

export function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  useGsapReveal(arrowRef, { delay: 1.5, y: -20 });
  useGsapParallax(contentRef, { speed: 0.4 });

  return (
    <section id="hero" className="relative w-full h-[100svh] flex items-center justify-center overflow-hidden bg-background">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 z-0 bg-gradient-mesh opacity-50 dark:opacity-20" />
      
      {/* Floating Particles/Shapes could go here */}

      <div ref={contentRef} className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full pt-20">
        
        {/* Main Title - Huge text like Lando Norris */}
        <div className="flex flex-col items-center">
          <AnimatedText
            as="h2"
            text="PEMUDA"
            variant="reveal"
            className="text-5xl md:text-[8rem] lg:text-[10rem] font-title font-bold leading-[0.85] tracking-tighter text-foreground drop-shadow-sm"
            duration={1}
          />
          <AnimatedText
            as="h2"
            text="MOJOSONGO"
            variant="reveal"
            className="text-5xl md:text-[8rem] lg:text-[10rem] font-title font-bold leading-[0.85] tracking-tighter text-transparent disabled-text-gradient bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500"
            delay={0.2}
            duration={1}
          />
        </div>

        {/* Subtitle */}
        <AnimatedText
          as="p"
          text="BERSATU • BERKARYA • BERJAYA"
          variant="typewriter"
          delay={1}
          className="mt-8 md:mt-12 text-sm md:text-xl font-medium tracking-[0.3em] uppercase text-muted-foreground"
        />

        {/* Short desc */}
        <div className="mt-8 max-w-2xl opacity-0 animate-[fadeIn_1s_ease-out_1.5s_forwards]">
          <p className="text-base md:text-lg text-foreground/80 font-body">
            Wadah kreativitas, inovasi, dan kepedulian sosial bagi generasi muda Kelurahan Mojosongo, Surakarta.
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        ref={arrowRef}
        onClick={() => scrollTo("#stats")}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer flex flex-col items-center gap-2 group p-4"
      >
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground group-hover:text-primary transition-colors">
          Scroll
        </span>
        <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors">
          <ArrowDown className="w-4 h-4 text-foreground group-hover:text-primary animate-bounce" />
        </div>
      </div>
    </section>
  );
}
