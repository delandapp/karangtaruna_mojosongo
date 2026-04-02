"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { useGsapReveal, useGsapParallax } from "@/lib/hooks/useGsapAnimation";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDown } from "lucide-react";
import Aurora from "@/components/react-bits/aurora";
import RotatingText from "@/components/react-bits/text-rotating";

export function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const title1Ref = useRef<HTMLHeadingElement>(null);
  const title2Ref = useRef<HTMLHeadingElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const parallaxWrapperRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  
  const { scrollTo } = useSmoothScroll();

  useGsapReveal(arrowRef, { delay: 1.5, y: -20 });
  
  // Custom Initial Timeline + Mouse Parallax
  useGSAP(() => {
    // 1. Full-page curtain wipe
    gsap.fromTo(
      curtainRef.current,
      { scaleY: 1, transformOrigin: "bottom" },
      { scaleY: 0, duration: 1.5, ease: "power4.inOut" }
    );

    // Fade in text elements with GSAP instead of relying solely on the atom components where we need precise orchestration
    gsap.fromTo(subtitleRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 1.6, ease: "power3.out" });
    gsap.fromTo(descRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 1.9, ease: "power3.out" });

    // 2. Mouse parallax on depth
    const wrapper = parallaxWrapperRef.current;
    if (!wrapper) return;
    
    const xTo1 = gsap.quickTo(title1Ref.current, "x", { duration: 1, ease: "power3.out" });
    const yTo1 = gsap.quickTo(title1Ref.current, "y", { duration: 1, ease: "power3.out" });
    const xTo2 = gsap.quickTo(title2Ref.current, "x", { duration: 1.2, ease: "power3.out" });
    const yTo2 = gsap.quickTo(title2Ref.current, "y", { duration: 1.2, ease: "power3.out" });
    const xToDesc = gsap.quickTo(descRef.current, "x", { duration: 1.4, ease: "power3.out" });
    const yToDesc = gsap.quickTo(descRef.current, "y", { duration: 1.4, ease: "power3.out" });
    
    const moveContent = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 50; 
      const y = (e.clientY / window.innerHeight - 0.5) * 50;
      xTo1(-x); yTo1(-y);
      xTo2(-x * 2); yTo2(-y * 2); // Title 2 moves more (parallax depth)
      xToDesc(-x * 0.5); yToDesc(-y * 0.5);
    };
    
    window.addEventListener("mousemove", moveContent);
    return () => window.removeEventListener("mousemove", moveContent);
  }, { scope: contentRef });

  return (
    <section id="hero" className="relative w-full h-[100svh] flex items-center justify-center bg-background pointer-events-auto overflow-hidden">
      {/* Curtain Wipe overlay for mount animation */}
      <div ref={curtainRef} className="absolute inset-0 z-50 bg-foreground" />
      
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 z-0 bg-gradient-mesh opacity-50 dark:opacity-20" />
      
      {/* Aurora WebGL Background */}
      <div className="absolute inset-0 z-0 opacity-100 dark:opacity-80 overflow-hidden pointer-events-none">
        <Aurora 
          colorStops={["#FD1D1D", "#E1306C", "#9c0707", "#ff6b6b"]} 
          blend={0.6}
          amplitude={1.2}
          speed={0.4}
        />
      </div>

      <div ref={parallaxWrapperRef} className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto w-full pt-20">
        
        {/* Main Title */}
        <div ref={contentRef} className="flex flex-col items-center">
          <div ref={title1Ref}>
            <AnimatedText
              as="h2"
              text="PEMUDA"
              variant="clip"
              className="text-6xl md:text-[8rem] lg:text-[10rem] font-title font-bold leading-[0.85] tracking-tighter text-foreground drop-shadow-sm"
              delay={0.5}
              duration={1.2}
            />
          </div>
          <div ref={title2Ref}>
            <AnimatedText
              as="h2"
              text="MOJOSONGO"
              variant="clip"
              className="text-6xl md:text-[8rem] lg:text-[10rem] font-title font-bold leading-[0.85] tracking-tighter text-transparent disabled-text-gradient bg-clip-text bg-gradient-to-r from-primary-500 to-accent-500"
              delay={0.6}
              duration={1.2}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div ref={subtitleRef} className="mt-8 md:mt-12 flex justify-center text-sm md:text-xl font-medium tracking-[0.3em] uppercase text-primary font-title">
          <RotatingText 
            texts={["BERSATU", "BERKARYA", "BERJAYA", "BERKOLABORASI", "BERKONTRIBUSI"]}
            mainClassName="overflow-hidden inline-flex"
            staggerDuration={0.03}
            staggerFrom="last"
            rotationInterval={3000}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            animatePresenceMode="wait"
          />
        </div>

        {/* Short desc */}
        <div ref={descRef} className="mt-8 max-w-2xl text-base md:text-lg text-foreground/80 font-body relative z-20">
          Wadah kreativitas, inovasi, dan kepedulian sosial bagi generasi muda Kelurahan Mojosongo, Surakarta.
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
          <ArrowDown className="w-4 h-4 text-foreground group-hover:text-primary" />
        </div>
      </div>
    </section>
  );
}
