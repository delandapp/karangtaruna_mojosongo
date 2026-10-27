"use client";

import React from "react";
import Image from "next/image";
import { MEDIA_PARTNERS } from "@/lib/data/media-partners";
import { Sparkles, Users, Radio, ExternalLink } from "lucide-react";

export function MediaPartnerSection() {
  // Duplicate for seamless infinite marquee loop
  const marqueeList = [...MEDIA_PARTNERS, ...MEDIA_PARTNERS];

  return (
    <section className="relative w-full py-16 md:py-20 overflow-hidden bg-gradient-to-b from-transparent via-emerald-50/30 dark:via-emerald-950/20 to-transparent">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200/60 dark:border-white/10">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-400 font-sans">
              Jaringan Publikasi Resmi
            </span>
            <h3 className="text-xl md:text-2xl font-bold font-sans text-slate-900 dark:text-white mt-1">
              14 Media Partner Kolaborasi Solo Raya
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 font-sans">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 backdrop-blur-md shadow-xs">
              <span>
                Jangkauan Regional: <strong className="text-slate-900 dark:text-white font-bold">1.500.000+</strong> Pembaca
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Marquee */}
      <div className="relative w-full overflow-hidden mask-gradient-x py-2">
        <div className="flex gap-4 sm:gap-6 animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
          {marqueeList.map((partner, idx) => (
            <div
              key={`${partner.id}-${idx}`}
              className="group inline-flex items-center gap-3.5 px-4 sm:px-5 py-3 rounded-full bg-white/75 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-default shrink-0"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden p-0.5 bg-slate-100 dark:bg-slate-800 shadow-xs shrink-0 ring-1 ring-slate-200/80 dark:ring-white/10">
                <div className="w-full h-full rounded-full overflow-hidden relative bg-white">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    loading="lazy"
                    quality={80}
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="44px"
                  />
                </div>
              </div>

              <div className="flex flex-col text-left font-sans">
                <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                  {partner.name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {partner.handle} • <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{partner.followers}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tailwind marquee animation custom keyframes support */}
      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .mask-gradient-x {
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 5%,
            black 95%,
            transparent 100%
          );
        }
      `}</style>
    </section>
  );
}
