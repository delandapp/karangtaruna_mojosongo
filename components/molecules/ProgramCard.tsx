"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { useGsapReveal, useGsapMagnetic } from "@/lib/hooks/useGsapAnimation";

interface ProgramCardProps {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
  color?: "primary" | "accent";
  index: number;
}

export function ProgramCard({
  title,
  subtitle,
  description,
  image,
  href,
  color = "primary",
  index,
}: ProgramCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Stagger reveal based on index
  useGsapReveal(cardRef, { delay: index * 0.2, y: 100 });
  useGsapMagnetic(buttonRef, 0.4);

  const bgColorClass = color === "primary" ? "bg-primary/90" : "bg-accent/90";

  return (
    <Link 
      href={href}
      ref={cardRef}
      className="group relative flex flex-col justify-end w-full h-[500px] md:h-[600px] rounded-3xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 flex flex-col gap-4 transform transition-transform duration-500 ease-out translate-y-4 group-hover:translate-y-0">
        
        {/* Category Label */}
        <div className="overflow-hidden">
          <span className={cn(
            "inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md border border-white/20 transform transition-transform duration-500 delay-100 translate-y-full group-hover:translate-y-0",
             bgColorClass
          )}>
            {subtitle}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-3xl md:text-5xl font-title text-white leading-tight">
          {title}
        </h3>

        {/* Description */}
        <div className="overflow-hidden grid grid-rows-[0fr] transition-all duration-500 ease-out group-hover:grid-rows-[1fr]">
          <p className="min-h-0 text-white/80 font-body text-lg max-w-md opacity-0 transition-opacity duration-500 delay-200 group-hover:opacity-100">
            {description}
          </p>
        </div>
      </div>

      {/* Magnetic Floating Button */}
      <div className="absolute top-8 right-8 z-20 overflow-hidden rounded-full drop-shadow-lg">
        <div 
          ref={buttonRef}
          className={cn(
            "flex items-center justify-center w-14 h-14 rounded-full text-white transform translate-x-12 -translate-y-12 transition-all duration-500 ease-out group-hover:translate-x-0 group-hover:translate-y-0",
            bgColorClass
          )}
        >
          <ArrowUpRight className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>
    </Link>
  );
}
