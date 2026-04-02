"use client";

import React, { useRef } from "react";
import Ballpit from "@/components/react-bits/ballpit";
import BorderGlow from "@/components/react-bits/border-glow";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { useGsapCountUp, useGsapReveal } from "@/lib/hooks/useGsapAnimation";

export function YouthSection() {
  const stat1Ref = useRef<HTMLSpanElement>(null);
  const stat2Ref = useRef<HTMLSpanElement>(null);
  const stat3Ref = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useGsapCountUp(stat1Ref, 120, { duration: 2, suffix: "+" });
  useGsapCountUp(stat2Ref, 15, { duration: 2, suffix: " RW" });
  useGsapCountUp(stat3Ref, 24, { duration: 2, suffix: "th" });
  useGsapReveal(cardsRef, { y: 60, stagger: 0.1 });

  const members = [
    { role: "Ketua", name: "Ahmad Faisal" },
    { role: "Wakil Ketua", name: "Dina Mariana" },
    { role: "Sekretaris", name: "Budi Santoso" },
  ];

  return (
    <section id="pengurus" className="relative w-full py-32 bg-n-900 border-t border-n-800 text-white min-h-svh flex flex-col justify-center overflow-hidden">
      
      {/* Full Interactive Background */}
      <div className="absolute inset-0 z-0">
         <div className="w-full h-full relative">
            <Ballpit
               count={150}
               gravity={0.3}
               friction={0.9}
               wallBounce={0.8}
               followCursor={true}
            />
         </div>
      </div>
      {/* Overlay to dim ballpit output */}
      <div className="absolute inset-0 z-0 bg-n-900/60 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 pointer-events-none">
        <div className="text-center mb-16 relative z-10">
          <AnimatedText as="h2" text="SIAPA KAMI?" className="text-5xl md:text-7xl font-title font-bold text-white mb-6" />
          <p className="text-n-300 font-body max-w-2xl mx-auto text-lg">
            Kami adalah kumpulan pemuda aktif yang berdedikasi tinggi untuk memajukan kelurahan Mojosongo. Energi positif kami tak pernah habis.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <span ref={stat1Ref} className="text-5xl md:text-6xl font-bold font-title text-primary-400 mb-2">0</span>
            <span className="text-n-300 font-medium tracking-wider">Anggota Aktif</span>
          </div>
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <span ref={stat2Ref} className="text-5xl md:text-6xl font-bold font-title text-accent-400 mb-2">0</span>
            <span className="text-n-300 font-medium tracking-wider">Cakupan Wilayah</span>
          </div>
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <span ref={stat3Ref} className="text-5xl md:text-6xl font-bold font-title text-blue-400 mb-2">0</span>
            <span className="text-n-300 font-medium tracking-wider">Rata-rata Usia</span>
          </div>
        </div>

      </div>
    </section>
  );
}
