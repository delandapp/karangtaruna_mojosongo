"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, ArrowRightCircle, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import BlurText from "@/components/react-bits/text-blur";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

import img1 from "@/assets/images/gallery/dokumentasi_donasi_sumatra_2026.jpg";
import img2 from "@/assets/images/gallery/dokumentasi_makrab_2025.jpg";
import img3 from "@/assets/images/gallery/dokumentasi_festival_ramadhan_2026.jpg";

const galleryItems = [
  {
    id: 1,
    src: img1,
    title: "Donasi Sumatra 2026",
    date: "12 Mar 2026",
    location: "Sumatra"
  },
  {
    id: 2,
    src: img2,
    title: "Makrab Pemuda 2025",
    date: "20 Nov 2025",
    location: "Tawangmangu"
  },
  {
    id: 3,
    src: img3,
    title: "Festival Ramadhan",
    date: "15 Apr 2026",
    location: "Mojosongo"
  },
];

export function GallerySection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const containerRef = useRef<HTMLElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Stats Animation
    gsap.fromTo(statsRef.current,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

    // Gallery Cards Animation (in and out)
    if (galleryRef.current) {
      const cards = galleryRef.current.children;
      gsap.fromTo(cards,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top 85%",
            toggleActions: "play reverse play reverse"
          }
        }
      );
    }

    // Footer Line Animation
    gsap.fromTo(footerRef.current,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          toggleActions: "play reverse play reverse"
        }
      }
    );

  }, { scope: containerRef });

  return (
    <section id="galeri" ref={containerRef} className="relative w-full min-h-[100vh] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-26 xl:py-22 flex pt-[100px] overflow-hidden">
      
      {/* Inner Container consistent with Gen+ HeroSection padding/margin/width */}
      <div className="w-full h-full flex flex-col gap-12 lg:gap-8 relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 rounded-[2.5rem] sm:rounded-[6.5rem] flex-1">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          
          {/* Title with responsive text sizes from Karang Taruna HeroSection */}
          <div className="text-4xl md:text-5xl lg:text-6xl font-title font-bold text-n-900 dark:text-n-50 leading-tight tracking-tight drop-shadow-md pb-4 italic">
            <BlurText 
              text="Access to high- Quality," 
              delay={50} 
              animateBy="words" 
              direction="top" 
              className="inline-block" 
            />
            <br />
            <span className="text-accent-500">
              <BlurText 
                text="Eco-Friendly" 
                delay={50} 
                animateBy="words" 
                direction="top" 
                className="inline-block" 
              />
            </span>{' '}
            <BlurText 
              text="products" 
              delay={50} 
              animateBy="words" 
              direction="top" 
              className="inline-block" 
            />
            <br />
            <div className="flex items-center gap-4 mt-4 text-3xl md:text-4xl lg:text-5xl">
              <BlurText 
                text="and services" 
                delay={50} 
                animateBy="words" 
                direction="top" 
                className="inline-block" 
              /> 
              <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-n-500 font-light" strokeWidth={1.5} />
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-ui font-medium transition-colors ml-2 shadow-lg shadow-accent-500/20 not-italic">
                Contact Us
              </button>
            </div>
          </div>

          <div ref={statsRef} className="flex flex-col items-start md:items-end pt-4">
            <div className="flex -space-x-3 mb-2">
              {/* Mock Avatars */}
              <div className="w-12 h-12 rounded-full border-2 border-background bg-accent-100 dark:bg-accent-900/30 z-30 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-background bg-accent-200 dark:bg-accent-800/30 z-20 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="https://i.pravatar.cc/100?img=32" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-background bg-accent-300 dark:bg-accent-700/30 z-10 flex items-center justify-center overflow-hidden shadow-sm">
                <img src="https://i.pravatar.cc/100?img=33" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-n-100 dark:bg-n-800 z-0 flex items-center justify-center self-center ml-2 shadow-sm text-n-500 text-xs font-medium">
                +
              </div>
            </div>
            <div className="font-bold text-xl md:text-2xl text-n-900 dark:text-n-50 font-title italic">500+</div>
            <div className="text-n-500 dark:text-n-400 text-sm font-body font-medium not-italic">Happy Customers</div>
          </div>
        </div>

        {/* Responsive Gallery: Slider on Mobile, Accordion on Desktop */}
        <div className="relative w-full mt-4 group">
          <div 
            ref={galleryRef}
            className={`flex gap-6 h-[400px] md:h-[500px] w-full ${
              isMobile ? 'overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4' : 'flex-row'
            }`}
            onMouseLeave={() => !isMobile && setHoveredIndex(null)}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // hide scrollbar across browsers
          >
            {/* Injecting style to hide webkit scrollbar via global or inline is hard, scrollbarWidth is for Firefox */}
            <style dangerouslySetInnerHTML={{__html: `
              #galeri .scrollbar-hide::-webkit-scrollbar {
                  display: none;
              }
            `}} />
            
            {galleryItems.map((item, index) => {
              const isExpanded = hoveredIndex !== null ? hoveredIndex === index : index === 0;

              return (
                <motion.div
                  key={item.id}
                  className={`relative rounded-[2rem] overflow-hidden cursor-pointer shadow-lg shrink-0 ${
                    isMobile ? 'w-[90%] snap-center' : ''
                  }`}
                  onMouseEnter={() => !isMobile && setHoveredIndex(index)}
                  animate={{
                    width: isMobile ? "90%" : (isExpanded ? "50%" : "25%"),
                  }}
                  transition={{ type: "spring", stiffness: 260, damping: 25 }}
                >
                  <Image 
                    src={item.src} 
                    alt={item.title} 
                    fill 
                    className="object-cover"
                  />
                  
                  {/* Overlay elements */}
                  <div className="absolute top-5 left-5 z-10">
                    <div className="bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-xs font-ui font-semibold shadow-sm flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </div>
                  </div>
                  
                  <div className="absolute top-5 right-5 z-10">
                    <div className="bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full text-xs font-ui font-semibold shadow-sm flex items-center gap-2">
                      <FaMapMarkerAlt className="w-3.5 h-3.5" />
                      {item.location}
                    </div>
                  </div>

                  {/* Bottom Text Box */}
                  <div className="absolute bottom-6 left-6 z-10">
                    <div className="inline-flex flex-col bg-white/20 dark:bg-black/40 backdrop-blur-xl border border-white/30 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                      <span className="text-white/80 text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold mb-1">Galeri Kegiatan</span>
                      <h3 className="text-white font-title text-base md:text-lg font-semibold leading-snug drop-shadow-sm line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Slider Controls (Mobile only) */}
          {isMobile && (
            <>
              <button 
                onClick={() => {
                  if(galleryRef.current) {
                    const scrollAmount = galleryRef.current.clientWidth * 0.9;
                    galleryRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 text-white p-3 rounded-full shadow-lg hover:bg-white/30 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => {
                  if(galleryRef.current) {
                    const scrollAmount = galleryRef.current.clientWidth * 0.9;
                    galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/20 dark:bg-black/30 backdrop-blur-md border border-white/30 text-white p-3 rounded-full shadow-lg hover:bg-white/30 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Footer Line */}
        <div ref={footerRef} className="mt-8 flex items-center justify-between w-full">
          <div className="h-[2px] bg-n-200 dark:bg-n-700 flex-1 mr-8 relative overflow-hidden rounded-full">
            <div className="absolute top-0 left-0 h-full w-[20%] bg-accent-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-ui font-medium text-n-500 dark:text-n-400 border border-n-200 dark:border-n-700 px-5 py-2 rounded-full">Featured Work</span>
            <ArrowRightCircle className="w-8 h-8 text-n-400 dark:text-n-500 font-light" strokeWidth={1} />
          </div>
        </div>

      </div>
    </section>
  );
}
