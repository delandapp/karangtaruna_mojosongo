"use client";

import React, { useRef } from "react";
import { MagneticButton } from "@/components/atoms/MagneticButton";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import TrueFocus from "@/components/react-bits/text-true-focus";
import Plasma from "@/components/react-bits/plasma";
import { useGsapReveal, useGsapScrubText } from "@/lib/hooks/useGsapAnimation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  
  // Use scrub text for background title effect
  useGsapScrubText(containerRef, { start: "top 80%", end: "bottom 80%" });

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Background color wipe transition
    gsap.fromTo(
      containerRef.current,
      { clipPath: "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)" },
      {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          end: "top 30%",
          scrub: 1,
        }
      }
    );
  }, { scope: containerRef });

  useGsapReveal(textRef, { delay: 0.2, y: 30 });
  useGsapReveal(buttonRef, { delay: 0.6, y: 30 });

  return (
    <section id="cta" ref={containerRef} className="w-full py-32 md:py-48 relative overflow-hidden bg-primary text-primary-foreground flex flex-col items-center justify-center -mt-1 rounded-t-[40px] md:rounded-t-[80px]">
      
      {/* Plasma WebGL Background */}
      <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
        <Plasma 
          color="#ffffff"
          scale={0.5}
          speed={0.5}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center flex flex-col items-center max-w-4xl">
        <AnimatedText
          as="h2"
          text="JADILAH BAGIAN DARI"
          variant="slide-up"
          delay={0.1}
          className="text-2xl md:text-3xl font-title font-bold uppercase tracking-widest text-primary-100 mb-4"
        />
        
        <div className="mb-12">
           <TrueFocus 
              sentence="PERUBAHAN" 
              manualMode={false} 
              blurAmount={5} 
              borderColor="#ffffff" 
              glowColor="rgba(255, 255, 255, 0.6)" 
              animationDuration={1} 
              pauseBetweenAnimations={1.5} 
           />
        </div>
        
        <div ref={textRef}>
          <p className="text-xl md:text-2xl font-body text-primary-50 max-w-2xl mx-auto mb-16 opacity-90 leading-relaxed">
            Mari bersama-sama membangun, berkreasi, dan memberdayakan potensi pemuda untuk lingkungan yang lebih baik.
          </p>
        </div>

        <div ref={buttonRef}>
          <MagneticButton size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-xl h-20 px-16 font-bold rounded-full" intensity={0.5}>
            BERGABUNG SEKARANG
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
