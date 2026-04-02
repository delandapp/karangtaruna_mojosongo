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
  variant?: "reveal" | "typewriter" | "scramble" | "clip" | "slide-up";
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

  // Split logic based on variant
  const getElements = () => {
    if (variant === "slide-up") return text.split(" ");
    return text.split("");
  };

  const elements = getElements();

  useGSAP(() => {
    if (!containerRef.current) return;

    if (variant === "reveal") {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".el-item"),
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
    } else if (variant === "clip" || variant === "slide-up") {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".el-item"),
        { yPercent: 100 },
        {
          yPercent: 0,
          stagger: 0.05,
          duration,
          delay,
          ease: "power4.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 90%",
          },
        }
      );
    } else if (variant === "typewriter") {
      const chars = containerRef.current.querySelectorAll(".el-item");
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
      {elements.map((el, index) => (
        <span
          key={index}
          className="inline-block overflow-hidden" // wrapper for sliding up
          style={{ whiteSpace: el === " " ? "pre" : "normal" }}
        >
          <span className="el-item inline-block" style={{ whiteSpace: el === " " ? "pre" : "normal", display: "inline-block" }}>
            {el === " " && variant !== "slide-up" ? "\u00A0" : el}
          </span>
          {variant === "slide-up" && index < elements.length - 1 && "\u00A0"}
        </span>
      ))}
    </Component>
  );
}
