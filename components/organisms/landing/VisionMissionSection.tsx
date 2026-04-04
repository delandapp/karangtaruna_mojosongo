"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CheckCircle2 } from "lucide-react";
import SplitText from "@/components/react-bits/text-split";

const MISSIONS = [
  "Meningkatkan kualitas sumber daya manusia (SDM) pemuda melalui pelatihan dan edukasi berkelanjutan.",
  "Menumbuhkan jiwa kewirausahaan dan kemandirian ekonomi pemuda.",
  "Melestarikan nilai-nilai seni, budaya, dan kearifan lokal.",
  "Berperan aktif dalam kegiatan sosial, kemasyarakatan, dan lingkungan hidup.",
] as const;

export function VisionMissionSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Gunakan class selector agar lebih konsisten dibanding mutable array
    const highlights = gsap.utils.toArray<HTMLElement>(".mission-highlight", containerRef.current);
    
    // Pin duration: setiap misi mendapat 100% viewport, ditambah 50% untuk menahan posisi akhir
    const pinDuration = (MISSIONS.length * 100) + 50;
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: `+=${pinDuration}%`,
        pin: true,
        scrub: 1,
        pinSpacing: true, // pastikan spacing tersedia
      }
    });

    // 1. Animasi background text besar bersamaan dari awal (jika perlu direveal perlahan)
    if (textRef.current) {
      gsap.set(textRef.current, { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" });
      tl.to(
        textRef.current,
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ease: "none",
          duration: highlights.length * 1, // Durasi sesuai dengan item highlight
        },
        0 // Mulai dari awal timeline
      );
    }

    // 2. Reveal mission text satu-per-satu
    if (highlights.length > 0) {
      tl.to(
        highlights,
        {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ease: "none",
          duration: 1,
          stagger: 1
        },
        0
      );
    }
    
    // 3. Tambahkan sedikit delay kosong di akhir timeline agar section tertahan
    tl.to({}, { duration: 0.5 }); // Penahan kosong

  }, { scope: containerRef });

  return (
    <section id="visi-misi" ref={containerRef} className="relative w-full h-[100svh] bg-background overflow-hidden border-t border-border/50 flex flex-col justify-center">
      {/* Smooth top gradient blending with Hero's background */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      {/* Soft Blur Blobs */}
      <div className="absolute top-0 right-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-accent/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />

      <div className="container relative z-10 mx-auto px-6 max-w-6xl">
        <SplitText
          text="VISI & MISI"
          splitType="chars"
          className="text-primary font-bold tracking-widest text-sm mb-4"
          delay={50}
          duration={1.5}
          ease="power4.out"
          textAlign="left"
        />
        
        <div className="absolute -top-10 -left-10 z-0 select-none opacity-5 pointer-events-none">
           <h2 ref={textRef} className="text-[10rem] md:text-[15rem] font-bold font-title whitespace-nowrap leading-none text-transparent stroke-text" style={{ WebkitTextStroke: '2px currentColor' }}>VISI MISI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 relative z-10 mt-12">
          {/* Vision */}
          <div className="flex flex-col justify-center">
            <SplitText
              text="Membangun Generasi Emas Mojosongo."
              tag="h3"
              splitType="words"
              className="text-4xl md:text-6xl font-title font-bold text-foreground mb-6 leading-tight text-left"
              textAlign="left"
              delay={100}
              duration={1.5}
              ease="power4.out"
            />
            <SplitText
              text="Mewujudkan pemuda-pemudi Karang Taruna Kelurahan Mojosongo yang tangguh, mandiri, inovatif, dan berakhlak mulia melalui sinergi serta partisipasi aktif dalam pembangunan wilayah."
              tag="p"
              splitType="lines"
              className="text-lg md:text-xl text-muted-foreground leading-relaxed font-body text-left"
              textAlign="left"
              delay={150}
              duration={1.5}
              ease="power4.out"
            />
          </div>

          {/* Mission */}
          <div className="flex flex-col justify-center">
            <ul className="space-y-8 md:space-y-12">
              {MISSIONS.map((mission, idx) => (
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
                      className="mission-highlight absolute top-0 left-0 w-full h-full font-body text-xl md:text-2xl font-medium leading-relaxed text-foreground"
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
