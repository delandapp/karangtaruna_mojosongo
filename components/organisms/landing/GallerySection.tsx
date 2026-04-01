"use client";

import React, { useRef } from "react";
import { GalleryItem } from "@/components/molecules/GalleryItem";
import { useGsapHorizontalScroll } from "@/lib/hooks/useGsapAnimation";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { ArrowLeftRight } from "lucide-react";

export function GallerySection() {
  const containerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGsapHorizontalScroll(containerRef, contentRef);

  const images = [
    { title: "Malam Tirakatan 17 Agustus", category: "Kepatriotan", image: "https://images.unsplash.com/photo-1541625602330-2277a4c4618c?q=80&w=2070&auto=format&fit=crop" },
    { title: "Turnamen Voli Antar RW", category: "Olahraga", image: "https://images.unsplash.com/photo-1562552052-1f3ac43d78c0?q=80&w=2070&auto=format&fit=crop" },
    { title: "Pembagian Sembako Ramadan", category: "Sosial", image: "https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=2070&auto=format&fit=crop" },
    { title: "Pelatihan Digital Marketing", category: "Pendidikan", image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop" },
    { title: "Kerja Bakti Bersih Desa", category: "Lingkungan", image: "https://images.unsplash.com/photo-1530587191344-9dc887724128?q=80&w=2070&auto=format&fit=crop" },
    { title: "Festival Seni Budaya", category: "Seni", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop" },
  ];

  return (
    <section id="galeri" ref={containerRef} className="w-full h-[100svh] bg-n-900 text-n-50 relative overflow-hidden flex flex-col justify-center">
      
      {/* Header - Fixed during scroll */}
      <div className="absolute top-10 left-0 w-full px-6 z-20 flex justify-between items-end">
        <div className="container mx-auto">
           <AnimatedText as="h2" text="DOKUMENTASI" className="text-4xl md:text-7xl font-title font-bold text-n-50 opacity-80" />
           <p className="text-primary-400 font-medium tracking-widest mt-2">MOMEN TERBAIK KAMI</p>
        </div>
      </div>

      {/* Floating Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 flex flex-col items-center">
        <ArrowLeftRight size={120} strokeWidth={1} />
        <span className="font-title text-4xl mt-4 font-bold tracking-widest uppercase">Geser</span>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="w-full overflow-visible relative z-10 pl-[5vw] md:pl-[10vw]">
        <div ref={contentRef} className="flex gap-6 md:gap-12 w-max">
          {images.map((img, idx) => (
            <GalleryItem
              key={idx}
              image={img.image}
              title={img.title}
              category={img.category}
            />
          ))}
          {/* Spacer at the end for padding */}
          <div className="w-[10vw] shrink-0" />
        </div>
      </div>
    </section>
  );
}
