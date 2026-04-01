"use client";

import React from "react";
import { StatItem } from "@/components/molecules/StatItem";
import { Users, LayoutList, Calendar, Handshake } from "lucide-react";

export function StatsSection() {
  const stats = [
    { number: 500, suffix: "+", label: "Anggota Aktif", icon: <Users size={24} /> },
    { number: 15, suffix: "+", label: "Program Kerja", icon: <LayoutList size={24} /> },
    { number: 50, suffix: "+", label: "Kegiatan/Tahun", icon: <Calendar size={24} /> },
    { number: 10, suffix: "+", label: "Mitra Kolaborasi", icon: <Handshake size={24} /> },
  ];

  return (
    <section id="stats" className="w-full py-16 md:py-24 bg-card border-y border-border/50 relative z-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-border">
          {stats.map((stat, index) => (
            <StatItem 
              key={index} 
              index={index} 
              number={stat.number} 
              suffix={stat.suffix} 
              label={stat.label} 
              icon={stat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
