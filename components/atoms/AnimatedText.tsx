"use client";

import React, { useRef } from "react";
import { useGsapReveal } from "@/lib/hooks/useGsapAnimation";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface AnimatedTextProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  variant?: "reveal" | "typewriter" | "scramble";
  delay?: number;
  duration?: number;
}

export function AnimatedText({
  text,
  as: Component = "p",
  className,
  variant = "reveal",
  delay = 0,
  duration = 0.8,
}: AnimatedTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 1. Split Text into characters manually (without premium SplitText)
  const characters = text.split("");

  // 2. Different Animations based on variant
  useGSAP(() => {
    if (!containerRef.current) return;

    if (variant === "reveal") {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".char"),
        { y: isMobile ? 20 : 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.02,
          duration,
          delay,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
          },
        }
      );
    } else if (variant === "typewriter") {
      // Very simple typewriter effect
      const chars = containerRef.current.querySelectorAll(".char");
      gsap.set(chars, { opacity: 0 });
      gsap.to(chars, {
        opacity: 1,
        stagger: 0.05,
        duration: 0.1,
        delay,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
        },
      });
    }
  }, { scope: containerRef, dependencies: [variant, isMobile] });

  // 3. Render
  return (
    <Component
      ref={containerRef}
      className={cn("inline-block", className)}
      style={{ overflow: variant === "reveal" ? "hidden" : "visible" }}
    >
      {characters.map((char, index) => (
        <span
          key={index}
          className="char inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </span>
      ))}
    </Component>
  );
}
