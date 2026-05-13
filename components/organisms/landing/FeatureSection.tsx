"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Users, Target, HeartHandshake, Network } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "@/components/react-bits/text-blur";

gsap.registerPlugin(ScrollTrigger);

import img1 from "@/assets/images/feature/foto-website-1.jpg";
import img2 from "@/assets/images/feature/foto-website-2.jpg";

export function FeatureSection() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Left Column Animation (Images)
    gsap.fromTo(leftColRef.current,
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: leftColRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

    // Right Column Animation (Features list)
    if (rightColRef.current) {
      const items = rightColRef.current.children;
      gsap.fromTo(items,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: rightColRef.current,
            start: "top 85%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    }

    // Stats Animation
    if (statsRef.current) {
      const stats = statsRef.current.children;
      gsap.fromTo(stats,
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 95%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    }

  }, { scope: containerRef });

  return (
    <section id="fitur" ref={containerRef} className="relative w-full px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-26 xl:py-22 flex overflow-hidden">
      
      {/* Inner Container consistent with GallerySection / HeroSection */}
      <div className="w-full h-full flex flex-col gap-16 relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 rounded-[2.5rem] sm:rounded-[6.5rem] flex-1">
        
        {/* Main Content: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Left Column: Overlapping Images */}
          <div ref={leftColRef} className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center">
            {/* Main Image */}
            <div className="absolute top-0 right-0 w-[75%] h-[80%] rounded-[2rem] overflow-hidden shadow-2xl z-10">
              <Image src={img1} alt="Kegiatan Pemuda 1" fill className="object-cover" />
            </div>
            {/* Secondary Image */}
            <div className="absolute bottom-0 left-0 w-[60%] h-[60%] rounded-[2rem] overflow-hidden shadow-xl z-20 border-8 border-white dark:border-n-900">
              <Image src={img2} alt="Kegiatan Pemuda 2" fill className="object-cover" />
            </div>
            {/* Floating Badge */}
            <div className="absolute bottom-1/4 -right-2 lg:-right-6 z-30 bg-accent-500 text-white p-4 md:p-5 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col pr-2">
                <span className="font-title text-2xl md:text-3xl font-bold">150+</span>
                <span className="text-xs md:text-sm text-white/90 font-medium">Anggota Aktif</span>
              </div>
            </div>
          </div>

          {/* Right Column: Text Content & Features */}
          <div className="flex flex-col gap-8 lg:pl-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-accent-500 font-ui font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                <div className="w-8 h-[2px] bg-accent-500 rounded-full"></div>
                Tentang Kami
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-title font-black italic tracking-tight drop-shadow-md pb-2 text-n-900 dark:text-n-50 leading-tight">
                <BlurText 
                  text="Wadah Kreativitas &" 
                  delay={50} 
                  animateBy="words" 
                  direction="top" 
                  className="inline-block" 
                />
                <br />
                <span className="text-accent-500">
                  <BlurText 
                    text="Inspirasi" 
                    delay={50} 
                    animateBy="words" 
                    direction="top" 
                    className="inline-block" 
                  />
                </span>{' '}
                <BlurText 
                  text="Pemuda" 
                  delay={50} 
                  animateBy="words" 
                  direction="top" 
                  className="inline-block" 
                />
              </h2>
              <p className="text-n-500 dark:text-n-400 font-body text-base md:text-lg leading-relaxed max-w-xl">
                Bergabunglah bersama kami untuk mengembangkan potensi diri, berkontribusi pada masyarakat, dan menjalin solidaritas antar pemuda di lingkungan Mojosongo.
              </p>
            </div>

            <div ref={rightColRef} className="flex flex-col gap-6 mt-2">
              {/* Feature 1 */}
              <div className="flex gap-5 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 group-hover:bg-accent-500 transition-colors duration-300 shadow-sm border border-transparent group-hover:border-accent-400">
                  <Target className="w-6 h-6 text-accent-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-title text-xl font-bold text-n-900 dark:text-n-50">Pengembangan Diri</h3>
                  <p className="text-base text-n-500 dark:text-n-400 leading-relaxed">Tingkatkan soft skill dan hard skill melalui berbagai pelatihan dan kegiatan positif yang membangun.</p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="flex gap-5 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 group-hover:bg-accent-500 transition-colors duration-300 shadow-sm border border-transparent group-hover:border-accent-400">
                  <HeartHandshake className="w-6 h-6 text-accent-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-title text-xl font-bold text-n-900 dark:text-n-50">Aksi Sosial & Kepedulian</h3>
                  <p className="text-base text-n-500 dark:text-n-400 leading-relaxed">Turut serta dalam aksi nyata membangun kepedulian dan membantu lingkungan masyarakat sekitar.</p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="flex gap-5 items-start group">
                <div className="w-14 h-14 rounded-2xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 group-hover:bg-accent-500 transition-colors duration-300 shadow-sm border border-transparent group-hover:border-accent-400">
                  <Network className="w-6 h-6 text-accent-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-title text-xl font-bold text-n-900 dark:text-n-50">Jaringan & Relasi Kuat</h3>
                  <p className="text-base text-n-500 dark:text-n-400 leading-relaxed">Perluas koneksi, bertukar ide, dan bangun relasi solidaritas tinggi dengan sesama pemuda.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: Stats */}
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-4 pt-12 border-t border-n-200 dark:border-n-800">
          {/* Stat 1 */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <h4 className="text-4xl md:text-5xl lg:text-6xl font-title font-black text-n-900 dark:text-n-50 mb-2 italic tracking-tight drop-shadow-sm">
              2.5<span className="text-accent-500 text-2xl md:text-3xl font-bold ml-1">km²</span>
            </h4>
            <p className="text-sm md:text-base text-n-500 dark:text-n-400 font-body font-medium">Luas Wilayah</p>
          </div>
          {/* Stat 2 */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <h4 className="text-4xl md:text-5xl lg:text-6xl font-title font-black text-n-900 dark:text-n-50 mb-2 italic tracking-tight drop-shadow-sm">
              45<span className="text-accent-500 text-2xl md:text-3xl font-bold ml-1">+</span>
            </h4>
            <p className="text-sm md:text-base text-n-500 dark:text-n-400 font-body font-medium">Jumlah RT</p>
          </div>
          {/* Stat 3 */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <h4 className="text-4xl md:text-5xl lg:text-6xl font-title font-black text-n-900 dark:text-n-50 mb-2 italic tracking-tight drop-shadow-sm">
              15<span className="text-accent-500 text-2xl md:text-3xl font-bold ml-1">+</span>
            </h4>
            <p className="text-sm md:text-base text-n-500 dark:text-n-400 font-body font-medium">Jumlah RW</p>
          </div>
          {/* Stat 4 */}
          <div className="flex flex-col items-center justify-center text-center p-4">
            <h4 className="text-4xl md:text-5xl lg:text-6xl font-title font-black text-n-900 dark:text-n-50 mb-2 italic tracking-tight drop-shadow-sm">
              150<span className="text-accent-500 text-2xl md:text-3xl font-bold ml-1">+</span>
            </h4>
            <p className="text-sm md:text-base text-n-500 dark:text-n-400 font-body font-medium">Jumlah Anggota</p>
          </div>
        </div>

      </div>
    </section>
  );
}
