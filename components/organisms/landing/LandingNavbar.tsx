"use client";

import React, { useState, useEffect } from "react";
import Logo from "@/components/atoms/Logo";
import { MagneticButton } from "@/components/atoms/MagneticButton";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Program", href: "#program" },
  { label: "Galeri", href: "#galeri" },
  { label: "Mitra", href: "#mitra" },
];

export function LandingNavbar() {
  const { scrollY, direction } = useScrollPosition();
  const { scrollTo } = useSmoothScroll();
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu on scroll or resize
  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  const isScrolled = scrollY > 50;
  const isHidden = scrollY > 300 && direction === "down" && !isOpen;

  return (
    <>
      <header
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-7xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
          isScrolled ? "py-2" : "py-4",
          isHidden ? "-translate-y-[150%] opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div className={cn(
          "flex items-center justify-between px-6 rounded-full transition-all duration-300",
          isScrolled ? "bg-background/80 backdrop-blur-lg border border-border/50 shadow-lg py-3" : "bg-transparent border-transparent py-2"
        )}>
          
          <Logo onClick={() => scrollTo(0)} variant={isScrolled ? "with-text" : "logo"} className="cursor-pointer" size={36} />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="text-sm font-semibold tracking-wide text-foreground/80 hover:text-primary transition-colors hover:scale-105 transform duration-200"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle size="sm" />
            <MagneticButton onClick={() => scrollTo("#cta")} variant="primary" size="sm" intensity={0.4}>
              Bergabung
            </MagneticButton>
          </div>

          {/* Mobile Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl transition-all duration-500 flex flex-col items-center justify-center gap-8 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {NAV_LINKS.map((link) => (
          <button
            key={link.label}
            onClick={() => {
              setIsOpen(false);
              scrollTo(link.href);
            }}
            className="text-4xl font-title font-bold text-foreground hover:text-primary transition-colors"
          >
            {link.label}
          </button>
        ))}
        <MagneticButton
          onClick={() => {
            setIsOpen(false);
            scrollTo("#cta");
          }}
          size="lg"
          className="mt-8 text-xl px-12"
        >
          Gabung Sekarang
        </MagneticButton>
      </div>
    </>
  );
}
