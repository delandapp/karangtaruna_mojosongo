"use client";

import React, { useRef } from "react";
import { FaStar, FaBolt, FaShieldAlt, FaHeadset, FaCheckCircle, FaCalendarAlt, FaArrowRight } from "react-icons/fa";
import { ScrollVelocityContainer, ScrollVelocityRow } from "@/components/magic-ui/scroll-velocity";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BlurText from "@/components/react-bits/text-blur";
import RotatingText from "@/components/react-bits/text-rotating";
import { MagneticButton } from "@/components/react-bits/magnetic-button";

gsap.registerPlugin(ScrollTrigger);

export function CtaSection() {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    
    // Animate CTA Card
    gsap.fromTo(cardRef.current, 
      { y: 50, opacity: 0, scale: 0.95 },
      { 
        y: 0, opacity: 1, scale: 1, 
        duration: 1, ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

    // Animate Logos label
    gsap.fromTo(logosRef.current, 
      { opacity: 0, y: 20 },
      { 
        opacity: 1, y: 0, 
        duration: 0.8, delay: 0.2, ease: "power2.out",
        scrollTrigger: {
          trigger: logosRef.current,
          start: "top 95%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

  }, { scope: containerRef });

  return (
    <section id="kolaborasi" ref={containerRef} className="relative w-full px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-26 xl:py-22 flex flex-col overflow-hidden gap-12 lg:gap-16">
      
      {/* CTA Card (Inner Container equivalent padding/margin but dark theme) */}
      <div ref={cardRef} className="w-full relative z-10 p-8 sm:p-10 md:p-12 lg:p-16 rounded-[2.5rem] sm:rounded-[4rem] lg:rounded-[5rem] bg-n-900 dark:bg-n-950 text-white shadow-2xl overflow-hidden border border-n-800">
        
        {/* Subtle Glow effects in background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-1/4 -left-1/4 w-[50%] h-[50%] bg-accent-500/20 blur-[100px] md:blur-[140px] rounded-full"></div>
           <div className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-accent-500/10 blur-[100px] md:blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Side: Text and Buttons */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/30 text-accent-400 px-4 py-2 rounded-full text-xs font-ui font-semibold w-fit">
              <FaStar className="w-3 h-3 text-accent-400" />
              Mari Berkolaborasi
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-title font-black leading-tight tracking-tight drop-shadow-md pb-2 italic text-white flex flex-col md:flex-row md:flex-wrap items-start md:items-baseline gap-x-3">
              Siap Berkolaborasi Untuk{" "}
              <div className="bg-accent-500/20 px-2 py-2 md:py-1 rounded-xl md:rounded-2xl border border-accent-500/30 flex items-center mt-2 md:mt-0 min-w-[300px] sm:min-w-[340px] md:min-w-[400px]">
                <RotatingText
                  texts={[
                    "Saling Menguntungkan ",
                    "Kegiatan Bermanfaat ",
                    "Inovasi Pemuda ",
                    "Masa Depan Bersama "
                  ]}
                  mainClassName="text-accent-500 overflow-visible w-full"
                  staggerFrom={"last"}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={3000}
                />
              </div>
            </h2>
            
            <p className="text-n-300 font-body text-base md:text-lg leading-relaxed max-w-lg mt-2">
              Kami membuka peluang besar bagi brand dan instansi untuk tumbuh bersama secara menguntungkan. Mari bersinergi menghadirkan kolaborasi kegiatan yang berkesan serta membawa manfaat positif yang nyata bagi masyarakat luas.
            </p>
            
            <div className="flex flex-row w-full items-center gap-3 mt-4">
              <div className="w-1/2 md:w-auto">
                <MagneticButton strength={0.4}>
                  <button className="w-full bg-accent-500 hover:bg-accent-600 text-white px-2 sm:px-6 md:px-8 py-3.5 rounded-xl font-ui font-black text-xs sm:text-sm md:text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-accent-500/25">
                    Gabung <FaArrowRight className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  </button>
                </MagneticButton>
              </div>
              <div className="w-1/2 md:w-auto">
                <MagneticButton strength={0.4}>
                  <button className="w-full bg-transparent hover:bg-white/5 border border-white/20 text-white px-2 sm:px-6 md:px-8 py-3.5 rounded-xl font-ui font-black text-xs sm:text-sm md:text-base transition-colors flex items-center justify-center gap-2">
                    Diskusi <FaCalendarAlt className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                  </button>
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* Right Side: Features Box */}
          <div className="flex flex-col gap-6 lg:pl-12">
            
            {/* Feature List */}
            <div className="flex flex-col gap-4">
              {/* Box 1 */}
              <div className="flex gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
                  <FaBolt className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h4 className="font-title text-base md:text-lg font-bold text-white">Program Inovatif</h4>
                  <p className="text-xs md:text-sm text-n-400">Kegiatan edukasi dan sosial yang berdampak</p>
                </div>
              </div>
              
              {/* Box 2 */}
              <div className="flex gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
                  <FaShieldAlt className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h4 className="font-title text-base md:text-lg font-bold text-white">Transparansi Penuh</h4>
                  <p className="text-xs md:text-sm text-n-400">Laporan kegiatan dan dana yang jelas</p>
                </div>
              </div>

              {/* Box 3 */}
              <div className="flex gap-4 items-center bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
                  <FaHeadset className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h4 className="font-title text-base md:text-lg font-bold text-white">Dukungan Solidaritas</h4>
                  <p className="text-xs md:text-sm text-n-400">Bimbingan & relasi antar sesama pemuda</p>
                </div>
              </div>
            </div>

            {/* Checkmarks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-2">
              <div className="flex items-center gap-2 text-xs md:text-sm text-n-300">
                <FaCheckCircle className="w-4 h-4 text-green-400" /> Fleksibel Waktu
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-n-300">
                <FaCheckCircle className="w-4 h-4 text-green-400" /> Bebas Biaya
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-n-300">
                <FaCheckCircle className="w-4 h-4 text-green-400" /> Kegiatan Positif
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Marquee Logos using ScrollVelocityContainer */}
      <div ref={logosRef} className="w-full flex flex-col items-center gap-6">
        <p className="text-xs md:text-sm font-semibold text-n-500 dark:text-n-400 uppercase tracking-widest text-center">
          Telah Berkolaborasi Bersama
        </p>
        
        {/* Scroll velocity magic-ui component */}
        <ScrollVelocityContainer className="w-full overflow-hidden mask-horizontal">
          <ScrollVelocityRow baseVelocity={1}>
            <div className="flex items-center gap-12 md:gap-24 px-6 md:px-12">
              {/* Local Logos text placeholders (resembling logos) */}
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">Pemerintah Kota</div>
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">Kemenpora RI</div>
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">Universitas Lokal</div>
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">Djarum Foundation</div>
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">PMI Peduli</div>
              <div className="text-xl md:text-3xl font-title font-bold text-n-300 dark:text-n-700 italic">Dinas Sosial</div>
            </div>
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
        
        {/* Inject mask CSS for smooth fade on edges */}
        <style dangerouslySetInnerHTML={{__html: `
          .mask-horizontal {
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          }
        `}} />
      </div>

    </section>
  );
}
