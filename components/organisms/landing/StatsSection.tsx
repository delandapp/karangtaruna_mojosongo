"use client";

import React, { useRef } from "react";
import { Users, LayoutList, Calendar, Handshake } from "lucide-react";
import { useGsapCountUp, useGsapStagger } from "@/lib/hooks/useGsapAnimation";

import ScrollVelocity from "@/components/react-bits/text-scroll-velocity";

export function StatsSection() {
  const containerRef = useRef<HTMLSelectElement>(null);
  
  // Use our new count up hook for each stat
  const countRefs = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];

  useGsapCountUp(countRefs[0], 500, { suffix: "+" });
  useGsapCountUp(countRefs[1], 15, { suffix: "+" });
  useGsapCountUp(countRefs[2], 50, { suffix: "+" });
  useGsapCountUp(countRefs[3], 10, { suffix: "+" });

  const stats = [
    { number: 500, suffix: "+", label: "Anggota Aktif", icon: <Users size={24} /> },
    { number: 15, suffix: "+", label: "Program Kerja", icon: <LayoutList size={24} /> },
    { number: 50, suffix: "+", label: "Kegiatan/Tahun", icon: <Calendar size={24} /> },
    { number: 10, suffix: "+", label: "Mitra Kolaborasi", icon: <Handshake size={24} /> },
  ];

  useGsapStagger(containerRef, ".stat-card", { y: 80, stagger: 0.15, triggerStart: "top 80%" });

  return (
    <section id="stats" ref={containerRef} className="w-full py-24 md:py-32 bg-background border-y border-border/50 relative z-20 text-foreground overflow-hidden flex flex-col items-center">
      
      <div className="w-full mb-16 opacity-10">
        <ScrollVelocity 
            texts={["KEMANDIRIAN • GOTONG ROYONG • INOVASI • "]} 
            velocity={20} 
            className="text-4xl md:text-8xl font-title font-bold tracking-widest text-primary uppercase stroke-text" 
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card flex flex-col items-center justify-center p-6 bg-n-800/50 backdrop-blur-sm rounded-2xl border border-n-700/50 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <div className="flex items-baseline gap-1 text-4xl md:text-5xl font-title font-bold text-n-50 mb-2">
                <span ref={countRefs[index]}>0</span>
              </div>
              <span className="text-sm md:text-base font-medium text-n-400 text-center">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
