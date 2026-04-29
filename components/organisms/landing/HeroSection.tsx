"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ArrowRight, Play, Hexagon } from "lucide-react";
import { MagneticButton } from "@/components/atoms/MagneticButton";
import BlurText from "@/components/react-bits/text-blur";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

// Static import for the illustration
import HeroIllustration from "@/assets/images/ilustrasi/ilustrasi-hero.png";

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const partnerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Animasi Text & CTA (Ease In & Ease Out)
    const elements = [textRef.current, ctaRef.current];
    elements.forEach((el, index) => {
      gsap.fromTo(el, 
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          delay: 0.3 + (index * 0.1),
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    });

    // Animasi Ilustrasi (Ease In & Ease Out)
    gsap.fromTo(imageRef.current,
      { scale: 0.9, opacity: 0, x: 50 },
      {
        scale: 1,
        opacity: 1,
        x: 0,
        duration: 1,
        delay: 0.2,
        ease: "back.out(1.5)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

    // Floating animation for image to make it dynamic
    gsap.to(imageRef.current, {
      y: -15,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Partner Section animation
    gsap.fromTo(partnerRef.current,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: partnerRef.current,
          start: "top 95%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

  }, { scope: containerRef });

  return (
    <section 
      id="hero" 
      ref={containerRef} 
      className="relative w-full min-h-screen pt-32 pb-16 overflow-hidden bg-gradient-to-br from-[#FFF8E7] to-[#E8F8F5] dark:from-n-900 dark:to-n-800"
    >
      <div className="container mx-auto px-6 h-full flex flex-col justify-center">
        
        {/* Main Content: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16 lg:mb-24">
          
          {/* Left Column: Text Content */}
          <div className="flex flex-col gap-6 text-center lg:text-left z-10 pt-10">
            <div className="text-4xl md:text-5xl lg:text-6xl font-title font-bold text-n-900 dark:text-n-50 leading-tight">
              <BlurText 
                text="Bersama Membangun"
                delay={50}
                animateBy="words"
                direction="top"
                className="inline-block"
              />
              <br />
              <BlurText 
                text="Kreativitas Pemuda"
                delay={50}
                animateBy="words"
                direction="top"
                className="inline-block text-accent-500 mr-3"
              />
              <BlurText 
                text="Mojosongo!"
                delay={50}
                animateBy="words"
                direction="top"
                className="inline-block"
              />
            </div>
            
            <div ref={textRef} className="text-n-600 dark:text-n-400 font-body text-lg md:text-xl max-w-xl mx-auto lg:mx-0">
              <p>Karang Taruna Kelurahan Mojosongo hadir sebagai wadah pengembangan potensi, membangun kreativitas, dan mendorong perubahan positif untuk lingkungan yang lebih baik.</p>
            </div>

            <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-6 mt-4 justify-center lg:justify-start">
              <MagneticButton 
                variant="primary" 
                size="lg" 
                className="bg-accent-500 hover:bg-accent-600 text-white rounded-full font-ui shadow-lg shadow-accent-500/20"
              >
                Mari Bergabung
                <ArrowRight className="ml-2 w-5 h-5" />
              </MagneticButton>
              
              <button className="group flex items-center gap-3 text-n-600 hover:text-accent-500 transition-colors font-ui font-medium">
                <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <Play className="w-5 h-5 ml-1 fill-current" />
                </div>
                Tonton Video
              </button>
            </div>
          </div>

          {/* Right Column: Illustration */}
          <div className="relative flex justify-center items-center h-[400px] lg:h-[500px]">
            <div ref={imageRef} className="relative w-full max-w-[500px] aspect-square z-10">
              <Image 
                src={HeroIllustration} 
                alt="Pemuda Karang Taruna" 
                fill 
                className="object-contain drop-shadow-2xl"
                priority
              />
              <div className="bg-orange-500 rounded-full w-64 h-64 -z-1 bottom-22 absolute right-18"></div>
            </div>
            {/* Background elements are handled by gradient-mesh and image itself based on reference */}
          </div>
        </div>

        {/* Bottom Section: Partners */}
        <div ref={partnerRef} className="w-full flex flex-col items-center justify-center gap-6 pb-8 border-t border-n-200/50 dark:border-n-700/50 pt-8 mt-auto">
          <p className="text-n-600 dark:text-n-400 font-poppins font-medium text-center">
            Lebih dari <span className="text-accent-500 font-bold">150+</span> Pemuda Telah Bergabung Bersama Kami!
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder Logos imitating reference */}
            <div className="flex items-center gap-2 text-n-500 font-title font-bold text-xl"><Hexagon className="w-6 h-6" /> Logoipsum</div>
            <div className="flex items-center gap-2 text-n-500 font-title font-bold text-xl"><Hexagon className="w-6 h-6" /> Logoipsum</div>
            <div className="flex items-center gap-2 text-n-500 font-title font-bold text-xl"><Hexagon className="w-6 h-6" /> Logoipsum</div>
            <div className="flex items-center gap-2 text-n-500 font-title font-bold text-xl hidden sm:flex"><Hexagon className="w-6 h-6" /> Logoipsum</div>
            <div className="flex items-center gap-2 text-n-500 font-title font-bold text-xl hidden md:flex"><Hexagon className="w-6 h-6" /> Logoipsum</div>
          </div>
        </div>

      </div>
    </section>
  );
}
