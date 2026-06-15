"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Camera, Images, Users, Sparkles, MapPin } from "lucide-react";
import BlurText from "@/components/react-bits/text-blur";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { galleryAlbums } from "@/lib/data/gallery";

/**
 * Hero section untuk halaman Galeri penuh.
 * Didukung Bento Grid Asimetris dengan efek Mouse-Parallax menggunakan GSAP,
 * serta detail metadata kamera retro untuk estetika premium "human-designed".
 */
export function GalleryHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const totalPhotos = galleryAlbums.reduce((sum, a) => sum + a.photoCount, 0);
  const totalAlbums = galleryAlbums.length;

  const stats = [
    { icon: Camera,  value: `${totalPhotos}+`, label: "Total Foto" },
    { icon: Images,  value: `${totalAlbums}`,  label: "Album Kegiatan" },
    { icon: Users,   value: "150+",             label: "Anggota Aktif" },
  ];

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.fromTo(
      textRef.current,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
    );

    gsap.fromTo(
      statsRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: "power3.out" }
    );

    gsap.fromTo(
      ".parallax-card-1, .parallax-card-2, .parallax-card-3, .parallax-card-4",
      { scale: 0.8, opacity: 0, y: 50 },
      {
        scale: 1,
        opacity: (index) => (index === 3 ? 0.6 : 1), // Card 4 is background accent
        y: 0,
        duration: 1.1,
        stagger: 0.1,
        ease: "back.out(1.2)",
        delay: 0.1
      }
    );
  }, { scope: containerRef });

  // Mouse Parallax Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(".parallax-card-1", { x: relX * 25, y: relY * 25, rotate: -2 + relX * 4, duration: 0.6, ease: "power2.out" });
    gsap.to(".parallax-card-2", { x: relX * -35, y: relY * -35, rotate: 3 + relX * -5, duration: 0.6, ease: "power2.out" });
    gsap.to(".parallax-card-3", { x: relX * 40, y: relY * -15, rotate: 1 + relX * 3, duration: 0.6, ease: "power2.out" });
    gsap.to(".parallax-card-4", { x: relX * -15, y: relY * 30, rotate: -4 + relX * -3, duration: 0.6, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    gsap.to(".parallax-card-1", { x: 0, y: 0, rotate: -2, duration: 0.8, ease: "power2.out" });
    gsap.to(".parallax-card-2", { x: 0, y: 0, rotate: 3, duration: 0.8, ease: "power2.out" });
    gsap.to(".parallax-card-3", { x: 0, y: 0, rotate: 1, duration: 0.8, ease: "power2.out" });
    gsap.to(".parallax-card-4", { x: 0, y: 0, rotate: -4, duration: 0.8, ease: "power2.out" });
  };

  const cards = [
    {
      id: "parallax-card-1",
      className: "parallax-card-1 absolute w-[50%] h-[72%] left-[0%] top-[4%] z-20 transition-shadow hover:shadow-primary-500/20 shadow-2xl rounded-2xl overflow-hidden border border-n-200/50 dark:border-white/10 bg-n-800/10 backdrop-blur-sm",
      src: "/gallery/festival-ramadhan-2026/cover.jpg",
      title: "Festival Ramadhan",
      meta: "MJS-2026 / SHUTTER 1/125s",
      iso: "ISO 400",
      lens: "35mm f/1.8",
      rotation: -2
    },
    {
      id: "parallax-card-2",
      className: "parallax-card-2 absolute w-[44%] h-[42%] left-[56%] top-[0%] z-10 transition-shadow hover:shadow-accent-500/20 shadow-2xl rounded-2xl overflow-hidden border border-n-200/50 dark:border-white/10 bg-n-800/10 backdrop-blur-sm",
      src: "/gallery/lomba-krenova-2026/cover.png",
      title: "Lomba Krenova",
      meta: "MJS-2026 / SONY A7R",
      iso: "ISO 100",
      lens: "24-70mm f/2.8",
      rotation: 3
    },
    {
      id: "parallax-card-3",
      className: "parallax-card-3 absolute w-[42%] h-[48%] left-[54%] top-[48%] z-30 transition-shadow hover:shadow-primary-500/20 shadow-2xl rounded-2xl overflow-hidden border border-n-200/50 dark:border-white/10 bg-n-800/10 backdrop-blur-sm",
      src: "/gallery/sumpah-pemuda/cover.png",
      title: "Sumpah Pemuda",
      meta: "LOC: 7.5501° S, 110.8415° E",
      iso: "ISO 800",
      lens: "50mm f/1.4",
      rotation: 1
    },
    {
      id: "parallax-card-4",
      className: "parallax-card-4 absolute w-[30%] h-[38%] left-[30%] top-[34%] z-5 opacity-40 md:opacity-60 shadow-xl rounded-2xl overflow-hidden border border-n-200/40 dark:border-white/5 bg-n-800/10 backdrop-blur-sm",
      src: "/gallery/latihan-badminton/cover.png",
      title: "Latihan Bulutangkis",
      meta: "MJS ARCHIVE // NO. 04",
      iso: "ISO 1600",
      lens: "85mm f/1.8",
      rotation: -4
    }
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#FFFDF7] to-[#F3F9F6] dark:from-n-900 dark:to-n-800 py-24 md:py-32"
    >
      {/* ── Grid Backdrop Pattern (Premium design element) ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(95,104,128,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(95,104,128,0.04)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* ── Decorative Ambient Blobs ── */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary-500/8 dark:bg-primary-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent-500/8 dark:bg-accent-500/5 blur-[100px] pointer-events-none" />

      {/* ── Main Content Container ── */}
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
        
        {/* ── Left Side: Typography + Details ── */}
        <div ref={textRef} className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          
          {/* Tech/Archive System Tag */}
          <div className="flex items-center gap-2 self-center lg:self-start bg-accent-500/10 border border-accent-500/25 px-3 py-1 rounded-full text-accent-600 dark:text-accent-400 text-xs font-mono tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-accent-500 animate-pulse" />
            <span>Archive System / Aktif</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-title font-bold text-n-900 dark:text-n-50 leading-tight">
            <BlurText text="Jejak" delay={50} animateBy="words" direction="top" className="inline-block" />{" "}
            <BlurText text="Kebersamaan" delay={50} animateBy="words" direction="top" className="inline-block text-accent-500 mr-2" />
            <br className="hidden lg:block" />
            <BlurText text="Pemuda Kami" delay={50} animateBy="words" direction="top" className="inline-block" />
          </h1>

          {/* Body Description */}
          <p className="text-n-600 dark:text-n-400 font-body text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Menolak lupa pada setiap inisiatif, peluh, dan canda tawa. Selamat datang di dokumentasi resmi program kerja dan pengabdian masyarakat Karang Taruna Mojosongo.
          </p>

          {/* Technical stamp row */}
          <div className="hidden sm:flex items-center gap-6 border-t border-n-200/50 dark:border-n-800/80 pt-6 text-[10px] font-mono text-n-400 dark:text-n-500 uppercase tracking-widest self-center lg:self-start">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-accent-500" />
              <span>Jebres, Surakarta</span>
            </div>
            <div>•</div>
            <div>EST. 2025</div>
            <div>•</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />
              <span>Realtime Sync</span>
            </div>
          </div>

          {/* Modern stats block */}
          <div ref={statsRef} className="grid grid-cols-3 gap-4 border border-n-200/40 dark:border-white/5 bg-white/30 dark:bg-n-800/20 backdrop-blur-md p-4 rounded-2xl max-w-xl w-full mx-auto lg:mx-0 shadow-sm mt-2">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-accent-500" />
                  <span className="text-n-900 dark:text-n-50 font-title font-bold text-lg md:text-xl leading-none">
                    {stat.value}
                  </span>
                </div>
                <span className="text-[10px] font-ui text-n-500 dark:text-n-400 uppercase tracking-wider mt-1 text-center lg:text-left">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* ── Right Side: Interactive Bento Parallax Collage ── */}
        <div 
          ref={gridRef}
          className="flex-1 w-full max-w-[500px] lg:max-w-[550px] aspect-[4/3.2] md:h-[400px] lg:h-[460px] relative mt-6 lg:mt-0 select-none"
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className={card.className}
              style={{
                transform: `rotate(${card.rotation}deg)`,
                transformOrigin: "center center"
              }}
            >
              <Image
                src={card.src}
                alt={card.title}
                fill
                priority
                sizes="(max-width: 768px) 50vw, 30vw"
                className="object-cover pointer-events-none"
              />
              
              {/* Glassmorphic Technical Overlay label */}
              <div className="absolute bottom-2 left-2 right-2 p-2 rounded-xl bg-n-900/75 dark:bg-n-900/85 backdrop-blur-md border border-white/10 flex flex-col gap-0.5 pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="text-white text-[11px] font-semibold tracking-wide truncate">
                    {card.title}
                  </span>
                  <span className="text-accent-400 text-[8px] font-mono uppercase tracking-widest font-bold">
                    {card.meta.split(" / ")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8px] font-mono text-n-400">
                  <span>{card.meta.split(" / ")[1] || card.meta}</span>
                  <span className="hidden sm:inline">{card.lens}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Elegant minimalist bottom divider instead of generic wave */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-n-200/50 dark:via-n-800/80 to-transparent" />
    </div>
  );
}
