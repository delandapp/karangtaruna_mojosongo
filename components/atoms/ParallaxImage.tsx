"use client";

import React, { useRef } from "react";
import Image, { ImageProps } from "next/image";
import { useGsapParallax } from "@/lib/hooks/useGsapAnimation";
import { cn } from "@/lib/utils";

interface ParallaxImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  speed?: number;
  direction?: "up" | "down";
  containerClassName?: string;
}

export function ParallaxImage({
  src,
  alt,
  speed = 0.2, // Keep it subtle by default
  direction = "up",
  containerClassName,
  className,
  ...props
}: ParallaxImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  // Apply Parallax
  useGsapParallax(imageRef, { speed, direction });

  return (
    <div className={cn("relative overflow-hidden w-full h-full", containerClassName)}>
      <Image
        ref={imageRef}
        src={src}
        alt={alt}
        className={cn("object-cover will-change-transform scale-[1.2]", className)}
        {...props}
      />
    </div>
  );
}
