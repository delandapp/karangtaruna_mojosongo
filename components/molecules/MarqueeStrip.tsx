"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface MarqueeStripProps {
  children: React.ReactNode;
  speed?: number; // pixels per second roughly
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export function MarqueeStrip({
  children,
  speed = 50,
  direction = "left",
  pauseOnHover = true,
  className,
}: MarqueeStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useGSAP(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Clone content for seamless loop
    const content = scrollerRef.current;
    const items = Array.from(content.children);
    
    // Append clones
    items.forEach((item) => {
      const clone = item.cloneNode(true);
      content.appendChild(clone);
    });

    const totalWidth = content.scrollWidth / 2; // Half because we duplicated
    const duration = totalWidth / speed;

    const tl = gsap.timeline({ repeat: -1 });

    if (direction === "left") {
      gsap.set(content, { x: 0 });
      tl.to(content, {
        x: -totalWidth,
        duration: isMobile ? duration * 1.5 : duration,
        ease: "none",
      });
    } else {
      gsap.set(content, { x: -totalWidth });
      tl.to(content, {
        x: 0,
        duration: isMobile ? duration * 1.5 : duration,
        ease: "none",
      });
    }

    if (pauseOnHover) {
      containerRef.current.addEventListener("mouseenter", () => tl.pause());
      containerRef.current.addEventListener("mouseleave", () => tl.play());
    }

    return () => {
      if (pauseOnHover && containerRef.current) {
        containerRef.current.removeEventListener("mouseenter", () => tl.pause());
        containerRef.current.removeEventListener("mouseleave", () => tl.play());
      }
    };
  }, { scope: containerRef, dependencies: [direction, speed, isMobile] });

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden whitespace-nowrap flex items-center relative", className)}
    >
      <div ref={scrollerRef} className="inline-flex items-center gap-12 w-max">
        {children}
      </div>
    </div>
  );
}
