"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface GalleryItemProps {
  image: string;
  title: string;
  category: string;
  className?: string;
}

export function GalleryItem({ image, title, category, className }: GalleryItemProps) {
  return (
    <div className={cn("gallery-item relative w-[80vw] sm:w-[500px] h-[60vh] sm:h-[600px] rounded-2xl overflow-hidden group shrink-0", className)}>
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 80vw, 500px"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
      
      <div className="absolute bottom-0 left-0 w-full p-8 flex flex-col gap-2 transform translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="text-primary-300 text-sm font-bold uppercase tracking-widest">{category}</span>
        <h4 className="text-2xl font-title text-white">{title}</h4>
      </div>
    </div>
  );
}
