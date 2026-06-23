"use client";

import React from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { MagneticButton } from "@/components/atoms/MagneticButton";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden text-foreground">
      <LandingNavbar />
      
      {/* Background glitch effect element */}
      <div className="absolute inset-0 z-0 bg-gradient-mesh opacity-20" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <AnimatedText
           as="h1"
           text="404"
           variant="typewriter"
           className="text-[10rem] md:text-[15rem] leading-none font-title font-black text-transparent opacity-80"
           style={{ WebkitTextStroke: '2px currentColor' }}
        />
        
        <AnimatedText
           as="h2"
           text="HALAMAN TIDAK DITEMUKAN"
           className="text-2xl md:text-5xl font-title font-bold mt-4"
           delay={0.5}
        />
        
        <p className="mt-6 text-muted-foreground font-body text-lg max-w-md animate-[fadeIn_1s_ease_1s_forwards] opacity-0">
          Sepertinya Anda tersesat. Halaman yang Anda cari mungkin telah dipindahkan atau tidak pernah ada.
        </p>
        
        <div className="mt-12 animate-[fadeIn_1s_ease_1.5s_forwards] opacity-0">
           <MagneticButton href="/" size="lg" intensity={0.5}>
             KEMBALI KE BERANDA
           </MagneticButton>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
