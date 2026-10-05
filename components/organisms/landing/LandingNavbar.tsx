"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/atoms/Logo";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";

type NavLink = {
  label: string;
  href: string;
  isRoute?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { label: "Beranda", href: "#hero" },
  { label: "Galeri Dokumentasi", href: "#galeri" },
  { label: "Media Partner", href: "#mitra" },
  { label: "Sponsorship", href: "/sponsorship", isRoute: true },
  { label: "Warta Berita", href: "/berita", isRoute: true },
];

export function LandingNavbar() {
  const { scrollY, direction } = useScrollPosition();
  const { scrollTo } = useSmoothScroll();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const close = () => setIsOpen(false);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close, { passive: true });
    return () => {
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, []);

  const isScrolled = scrollY > 30;
  const isHidden = scrollY > 400 && direction === "down" && !isOpen;

  const handleNavClick = (link: NavLink) => {
    setIsOpen(false);
    if (!link.isRoute) {
      if (pathname !== "/") {
        window.location.href = `/${link.href}`;
      } else {
        scrollTo(link.href);
      }
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-6xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]",
          isHidden ? "-translate-y-[150%] opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300",
            "bg-white/80 dark:bg-n-900/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
          )}
        >
          {/* Logo with prominent branding */}
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo
              variant="with-text"
              size={38}
              title="Karang Taruna"
              subtitle="Kelurahan Mojosongo"
              className="cursor-pointer"
            />
          </Link>

          {/* Desktop Nav Links (Centered) */}
          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "text-xs font-semibold tracking-wide transition-all px-3 py-1.5 rounded-full hover:bg-emerald-500/10",
                    pathname === link.href
                      ? "text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10"
                      : "text-n-700 dark:text-n-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="text-xs font-semibold tracking-wide text-n-700 dark:text-n-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  {link.label}
                </button>
              )
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              href="/sponsorship"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bermitra Sponsor</span>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle size="sm" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 rounded-full bg-white/80 dark:bg-white/10 flex items-center justify-center text-n-800 dark:text-white border border-n-200/60 dark:border-white/10"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (iOS 27 Glass Sheet) */}
      <div
        className={cn(
          "fixed inset-0 z-[95] bg-black/60 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-end p-4 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={cn(
            "w-full max-w-md mx-auto rounded-[2.5rem] bg-white/95 dark:bg-n-900/95 border border-white/80 dark:border-white/10 p-6 shadow-2xl backdrop-blur-3xl transition-transform duration-300 flex flex-col gap-4",
            isOpen ? "translate-y-0" : "translate-y-12"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-n-100 dark:border-white/10">
            <Logo variant="with-text" size={32} />
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-n-100 dark:bg-white/10 flex items-center justify-center text-n-600 dark:text-n-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 py-2">
            {NAV_LINKS.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-2xl text-base font-bold text-n-800 dark:text-white hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="px-4 py-3 rounded-2xl text-base font-bold text-left text-n-800 dark:text-white hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between w-full"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </button>
              )
            )}
          </div>

          <div className="pt-2 border-t border-n-100 dark:border-white/10">
            <Link
              href="/sponsorship"
              onClick={() => setIsOpen(false)}
              className="w-full py-3.5 px-6 rounded-full bg-emerald-600 text-white font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Peluang Sponsorship & Kemitraan</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
