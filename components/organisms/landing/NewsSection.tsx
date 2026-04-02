"use client";

import React, { useRef } from "react";
import BlurText from "@/components/react-bits/text-blur";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const news = [
  {
    title: "Pelatihan Sablon Digital untuk Pemuda",
    date: "12 Oct 2024",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1470&auto=format&fit=crop",
    category: "UMKM"
  },
  {
    title: "Kerja Bakti Massal Jelang Musim Hujan",
    date: "05 Oct 2024",
    image: "https://images.unsplash.com/photo-1563207153-f4350df2c589?q=80&w=1470&auto=format&fit=crop",
    category: "Sosial"
  },
  {
    title: "Turnamen Futsal Mojosongo Cup",
    date: "28 Sep 2024",
    image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1470&auto=format&fit=crop",
    category: "Olahraga"
  }
];

export function NewsSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const cards = gsap.utils.toArray<HTMLElement>('.news-card');
    
    // Batch reveal cards
    ScrollTrigger.batch(cards, {
      onEnter: (elements) => {
        gsap.fromTo(elements, 
          { y: 100, opacity: 0, skewY: 5 }, 
          { y: 0, opacity: 1, skewY: 0, duration: 0.8, stagger: 0.15, ease: "back.out(1.7)" }
        );
      },
      once: true
    });
  }, { scope: containerRef });

  return (
    <section id="berita" ref={containerRef} className="w-full pt-32 pb-48 bg-n-50 dark:bg-background border-t border-border/50 text-foreground overflow-visible">
      <div className="container max-w-7xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold font-title mb-4">
              <BlurText text="BERITA & KEGIATAN" delay={50} animateBy="letters" />
            </h2>
            <p className="text-muted-foreground font-body text-lg">
              Kabar terbaru dan dokumentasi kegiatan dari pemuda Karang Taruna Mojosongo.
            </p>
          </div>
          <Link href="#" className="flex transition-colors items-center gap-2 font-bold uppercase tracking-widest text-sm bg-primary/10 text-primary px-6 py-3 rounded-full hover:bg-primary hover:text-white">
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item, idx) => (
            <Link href="#" key={idx} className="news-card group block">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mb-6">
                <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="px-2">
                <div className="text-primary font-bold text-sm tracking-widest mb-3">{item.date}</div>
                <h3 className="text-2xl font-bold font-title leading-tight mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                <div className="w-12 h-1 bg-border group-hover:w-full group-hover:bg-primary transition-all duration-500 ease-out rounded-full" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
