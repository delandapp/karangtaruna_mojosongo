"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, PhoneCall } from "lucide-react";
import GlowHover from "@/components/smoothui/glow-hover-card";
import BlurText from "@/components/react-bits/text-blur";
import TrueFocus from "@/components/react-bits/text-true-focus";
import RotatingText from "@/components/react-bits/text-rotating";
import CountUp from "@/components/react-bits/text-count";
import ScrollVelocity from "@/components/react-bits/text-scroll-velocity";
import { AnimatedShinyButton } from "@/components/ui/animated-shiny-button";

export function SponsorshipSection() {
  return (
    <section
      id="sponsorship"
      className="relative w-full py-12 sm:py-16 overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Animated Header Section with TrueFocus & BlurText */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="flex justify-center mb-4">
            <TrueFocus
              sentence="Peluang Kemitraan Sponsorship Brand"
              manualMode={false}
              blurAmount={4}
              borderColor="#10b981"
              glowColor="rgba(16, 185, 129, 0.45)"
              animationDuration={0.45}
              pauseBetweenAnimations={1.6}
            />
          </div>

          <BlurText
            text="Jangkau 55.800+ Warga & 1 Juta Impresi Media"
            delay={50}
            animateBy="words"
            direction="top"
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold text-slate-900 dark:text-white tracking-tight leading-tight justify-center flex flex-wrap"
          />

          <div className="mt-3.5 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm font-sans shadow-xs backdrop-blur-xl">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Target Dampak Brand:
              </span>
              <div className="inline-flex items-center h-6 overflow-hidden relative">
                <RotatingText
                  texts={[
                    "1 Juta+ Impresi Media Bulanan",
                    "Akses 55.800+ Warga se-Mojosongo",
                    "Sinergi 39 Rukun Warga Terpadu",
                    "Publikasi 14 Media Partner Solo",
                  ]}
                  mainClassName="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm leading-none"
                  splitLevelClassName="overflow-hidden py-0.5"
                  staggerDuration={0.02}
                  rotationInterval={3000}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GlowHover Cards Container */}
        <GlowHover
          maskSize={420}
          glowIntensity={0.12}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto"
          items={[
            {
              id: "demography-card",
              theme: { hue: 160, saturation: 84, lightness: 39 },
              element: (
                <div className="lg:col-span-7 rounded-[2.25rem] p-7 sm:p-10 bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl shadow-sm dark:shadow-none flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Data Kunci Wilayah Mojosongo
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-bold font-sans text-slate-900 dark:text-white mt-1 mb-6">
                      Basis Konsumen Padat & Generasi Produktif
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                        <span className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-900 dark:text-white flex items-baseline">
                          <CountUp to={55800} separator="." duration={2.5} />
                          <span>+</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">Penduduk Terdata</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Kelurahan terpadat di Jebres</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                        <span className="text-2xl sm:text-3xl font-extrabold font-sans text-emerald-600 dark:text-emerald-400 flex items-baseline">
                          <CountUp to={1} duration={2} />
                          <span>&nbsp;Juta+</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">Impresi Media / Bulan</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Instagram & viral reach</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                        <span className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-900 dark:text-white flex items-baseline">
                          <CountUp to={39} duration={2} />
                          <span>&nbsp;RW</span>
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">250+ RT Aktif</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Jalur distribusi komunitas</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10">
                        <span className="text-2xl sm:text-3xl font-extrabold font-sans text-slate-900 dark:text-white">
                          <CountUp to={14} duration={1.8} />
                        </span>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">Media Partner Solo</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Publikasi serentak terpadu</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-200/60 dark:border-white/10">
                    <Link
                      href="/sponsorship"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
                    >
                      <span>Lihat Proposal & Paket Sponsorship</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    
                    <a
                      href="https://wa.me/6282327077569?text=Halo%20Tim%20Sponsorship%20Karang%20Taruna%20Mojosongo,%20kami%20tertarik%20untuk%20mengajukan%20kemitraan%20sponsor."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-white/10 hover:bg-white/20 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm border border-slate-200/80 dark:border-white/15 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Chat Koordinator Sponsor</span>
                    </a>
                  </div>
                </div>
              ),
            },
            {
              id: "social-card",
              theme: { hue: 160, saturation: 84, lightness: 39 },
              element: (
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Instagram Spotlight Card */}
                  <div className="p-7 rounded-[2rem] bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                          Instagram Official
                        </h4>
                        <a
                          href="https://instagram.com/karangtaruna.mojosongo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          @karangtaruna.mojosongo
                        </a>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        Kanal Utama
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center py-3 bg-white/50 dark:bg-white/[0.04] rounded-2xl border border-slate-200/50 dark:border-white/10">
                      <div>
                        <span className="text-2xl font-extrabold font-sans text-slate-900 dark:text-white flex justify-center items-baseline">
                          <CountUp to={1100} separator="." duration={2.5} />
                          <span>+</span>
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pengikut Aktif</p>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold font-sans text-emerald-600 dark:text-emerald-400 flex justify-center items-baseline">
                          <CountUp to={1} duration={2} />
                          <span>&nbsp;Juta+</span>
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Impresi Bulanan</p>
                      </div>
                    </div>

                    <a
                      href="https://instagram.com/karangtaruna.mojosongo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                    >
                      <span>Buka Profil Instagram</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>

                  {/* TikTok Spotlight Card */}
                  <div className="p-7 rounded-[2rem] bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                          TikTok Official
                        </h4>
                        <a
                          href="https://tiktok.com/@karangtaruna.mojosongo"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          @karangtaruna.mojosongo
                        </a>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        Viral Reach
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center py-3 bg-white/50 dark:bg-white/[0.04] rounded-2xl border border-slate-200/50 dark:border-white/10">
                      <div>
                        <span className="text-2xl font-extrabold font-sans text-slate-900 dark:text-white">Organik</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Audiens Pemuda</p>
                      </div>
                      <div>
                        <span className="text-2xl font-extrabold font-sans text-emerald-600 dark:text-emerald-400">FYP Solo</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Jangkauan Konten</p>
                      </div>
                    </div>

                    <a
                      href="https://tiktok.com/@karangtaruna.mojosongo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                    >
                      <span>Buka Profil TikTok</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
              ),
            },
          ]}
        />

        {/* Call to Action Button to Sponsorship Portal */}
        <div className="flex justify-center mt-8">
          <AnimatedShinyButton
            url="/sponsorship"
            className="text-xs sm:text-sm py-3 px-6 rounded-full font-bold shadow-lg shadow-emerald-500/20"
          >
            Pelajari Detail Proposal & Paket Sponsorship
          </AnimatedShinyButton>
        </div>

        {/* Scroll Velocity Text Banner */}
        <div className="w-full mt-10 overflow-hidden py-4 border-y border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <ScrollVelocity
            texts={[
              "1 JUTA IMPRESI BULANAN • 14 MEDIA PARTNER • 39 RUKUN WARGA • 55.800+ PENDUDUK •",
              "KARANG TARUNA MOJOSONGO • KEMITRAAN BRAND STRATEGIS • EXPOSURE REGIONAL SOLO RAYA •",
            ]}
            velocity={20}
            className="text-xs sm:text-sm font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase"
          />
        </div>

      </div>
    </section>
  );
}
