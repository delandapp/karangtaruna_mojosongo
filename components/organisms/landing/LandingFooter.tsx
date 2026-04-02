"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import { useGsapReveal, useGsapScrubText } from "@/lib/hooks/useGsapAnimation";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { ArrowUp } from "lucide-react";

export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const backToTopRef = useRef<HTMLButtonElement>(null);
  const hugeTextRef = useRef<HTMLHeadingElement>(null);
  const { scrollToTop } = useSmoothScroll();

  useGsapReveal(footerRef as React.RefObject<HTMLElement>, { y: 100, triggerStart: "top 95%" });
  useGsapScrubText(hugeTextRef, { start: "top bottom", end: "bottom bottom", direction: "bottom-to-top" });

  return (
    <footer ref={footerRef} className="w-full bg-card text-card-foreground border-t border-border pt-20 pb-10 relative z-30">
      <div className="container mx-auto px-6">
        
        {/* Top Huge Text */}
        <div className="w-full flex justify-center mb-20 overflow-hidden">
          <h2 ref={hugeTextRef} className="text-6xl md:text-[8rem] lg:text-[11rem] font-title font-black text-transparent opacity-20 tracking-tighter" style={{ WebkitTextStroke: '2px currentColor' }}>
            BERSATU.
          </h2>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          
          <div className="md:col-span-4 flex flex-col gap-6">
            <Logo size={40} variant="with-text" />
            <p className="text-muted-foreground font-body leading-relaxed max-w-sm">
              Sistem Informasi Terpadu Karang Taruna Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta. Wadah kreasi dan inovasi pemuda.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-7 flex flex-col gap-4">
            <h4 className="font-title font-bold text-xl uppercase tracking-wider">Menu</h4>
            <div className="flex flex-col gap-3">
              {['Beranda', 'Tentang Kami', 'Program', 'Galeri', 'Berita'].map(item => (
                <Link key={item} href="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-4">
            <h4 className="font-title font-bold text-xl uppercase tracking-wider">Kontak</h4>
            <div className="flex flex-col gap-3 text-muted-foreground font-medium">
              <p>📍 Jl. Mojosongo Raya No. 123</p>
              <p>📧 info@karangtarunamojosongo</p>
              <p>📞 +62 812 3456 7890</p>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between border-t border-border/50 pt-8 mt-12 gap-6">
          
          <p className="text-sm font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} Karang Taruna Kelurahan Mojosongo. All rights reserved.
          </p>

          {/* Magnetic Back To Top Button */}
          <button 
            ref={backToTopRef}
            onClick={() => scrollToTop(2)}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors focus:outline-none"
            aria-label="Back to top"
          >
            <ArrowUp size={24} />
          </button>
          
        </div>

      </div>
    </footer>
  );
}
