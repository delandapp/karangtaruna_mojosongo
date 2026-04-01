"use client";

import React, { useRef } from "react";
import { MagneticButton } from "@/components/atoms/MagneticButton";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { useGsapReveal } from "@/lib/hooks/useGsapAnimation";

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useGsapReveal(textRef, { delay: 0.2, y: 30 });
  useGsapReveal(buttonRef, { delay: 0.6, y: 30 });

  return (
    <section id="cta" ref={containerRef} className="w-full py-24 md:py-40 relative overflow-hidden bg-primary text-primary-foreground flex flex-col items-center justify-center">
      {/* Decorative large shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center max-w-4xl">
        <AnimatedText
          as="h2"
          text="JADILAH BAGIAN DARI"
          className="text-2xl md:text-4xl font-title font-bold uppercase tracking-widest text-primary-100 mb-2"
        />
        <AnimatedText
          as="h1"
          text="PERUBAHAN"
          className="text-6xl md:text-9xl font-title font-black leading-none drop-shadow-md mb-8"
          delay={0.2}
        />
        
        <div ref={textRef}>
          <p className="text-xl md:text-2xl font-body text-primary-50 max-w-2xl mx-auto mb-12">
            Mari bersama-sama membangun, berkreasi, dan memberdayakan potensi pemuda untuk kelurahan kita tercinta.
          </p>
        </div>

        <div ref={buttonRef}>
          <MagneticButton size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg h-16 px-12" intensity={0.5}>
            DAFTAR SEKARANG
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
