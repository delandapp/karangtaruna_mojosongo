"use client";

import React, { useRef } from "react";
import Aurora from "@/components/react-bits/aurora";
import { useGsapScrubText } from "@/lib/hooks/useGsapAnimation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { CheckCircle2 } from "lucide-react";

export function VisionMissionSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const missionRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useGSAP(() => {
    if (missionRefs.current.length === 0 || !containerRef.current) return;
    
    // Pin the entire section while scrubbing the texts
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=200%", // Pin for the duration of 200% viewport height
        pin: true,
        scrub: 1,
      }
    });

    // Reveal text horizontally by animating clipPath
    tl.to(
      missionRefs.current,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        ease: "none",
        stagger: 0.5,
      }
    );
  }, { scope: containerRef });

  // useGsapScrubText for the massive background text
  useGsapScrubText(textRef, { start: "top 80%", end: "bottom top" });

  return (
    <section id="visi-misi" ref={containerRef} className="relative w-full h-[100svh] bg-background overflow-hidden border-t border-border/50 flex flex-col justify-center">
      {/* Smooth top gradient blending with Hero's background */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      {/* Soft Blur Blobs */}
      <div className="absolute top-0 right-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-accent/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <AnimatedText as="h2" text="VISI & MISI" variant="clip" className="text-primary font-bold tracking-widest text-sm mb-4" />
        
        <div className="absolute -top-10 -left-10 z-0 select-none opacity-5 pointer-events-none">
           <h2 ref={textRef} className="text-[10rem] md:text-[15rem] font-bold font-title whitespace-nowrap leading-none text-transparent stroke-text" style={{ WebkitTextStroke: '2px currentColor' }}>VISI MISI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 relative z-10 mt-12">
          {/* Vision */}
          <div className="flex flex-col justify-center">
            <h3 className="text-4xl md:text-6xl font-title font-bold text-foreground mb-6 leading-tight">Membangun Generasi Emas Mojosongo.</h3>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-body">
              Mewujudkan pemuda-pemudi Karang Taruna Kelurahan Mojosongo yang tangguh, mandiri, inovatif, dan berakhlak mulia melalui sinergi serta partisipasi aktif dalam pembangunan wilayah.
            </p>
          </div>

          {/* Mission */}
          <div className="flex flex-col justify-center">
            <ul className="space-y-8 md:space-y-12">
              {[
                "Meningkatkan kualitas sumber daya manusia (SDM) pemuda melalui pelatihan dan edukasi berkelanjutan.",
                "Menumbuhkan jiwa kewirausahaan dan kemandirian ekonomi pemuda.",
                "Melestarikan nilai-nilai seni, budaya, dan kearifan lokal.",
                "Berperan aktif dalam kegiatan sosial, kemasyarakatan, dan lingkungan hidup."
              ].map((mission, idx) => (
                <li 
                  key={idx} 
                  className="flex gap-4 md:gap-6 items-start group"
                >
                  <div className="p-1.5 md:p-2 rounded-full bg-primary/10 text-primary mt-1 shadow-sm shrink-0">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="relative flex-1">
                    <p className="font-body text-xl md:text-2xl font-medium leading-relaxed text-muted-foreground/30">
                       {mission}
                    </p>
                    <p 
                      ref={(el) => { missionRefs.current[idx] = el; }}
                      className="absolute top-0 left-0 w-full h-full font-body text-xl md:text-2xl font-medium leading-relaxed text-foreground"
                      style={{ clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }}
                    >
                       {mission}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
