"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGsapReveal, useGsapMagnetic } from "@/lib/hooks/useGsapAnimation";

interface SocialCardProps {
  platform: string;
  url: string;
  icon: React.ReactNode;
  followers: string;
  colorClass: string;
  index: number;
}

export function SocialCard({
  platform,
  url,
  icon,
  followers,
  colorClass,
  index,
}: SocialCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGsapReveal(cardRef, { delay: index * 0.1, y: 60 });
  useGsapMagnetic(contentRef, 0.15); // Subtle magnetic effect on hover

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      ref={cardRef}
      className={cn(
        "group relative flex flex-col h-64 md:h-80 rounded-3xl p-8 overflow-hidden text-white transition-shadow hover:shadow-2xl hover:shadow-current/20",
        colorClass
      )}
    >
      {/* Expanding background ripple effect */}
      <span className="absolute inset-0 rounded-3xl bg-white/10 scale-0 origin-center transition-transform duration-500 group-hover:scale-[2.5] rounded-full" />
      
      <div ref={contentRef} className="relative z-10 flex flex-col h-full justify-between items-center text-center">
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm shadow-sm group-hover:bg-white/20 transition-colors duration-300">
          <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center">
             {icon}
          </div>
        </div>

        <div>
          <h4 className="text-xl md:text-3xl font-bold tracking-tight">{platform}</h4>
          <p className="text-sm md:text-base text-white/80 mt-1 font-medium">{followers} Pengikut</p>
        </div>
      </div>
    </Link>
  );
}
