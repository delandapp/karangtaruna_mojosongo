"use client";

import { useRef, RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useMediaQuery } from "./useMediaQuery";

// Ensure ScrollTrigger is registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// ----------------------------------------------------------------------
// 1. Reveal Animation (Fade & Slide up on scroll)
// ----------------------------------------------------------------------
interface RevealOptions {
  y?: number;
  duration?: number;
  delay?: number;
  ease?: string;
  triggerStart?: string;
  stagger?: number;
  opacity?: number;
}

export function useGsapReveal(
  ref: RefObject<HTMLElement | null>,
  options: RevealOptions = {}
) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const {
    y = 50,
    duration = 0.8,
    delay = 0,
    ease = "power3.out",
    triggerStart = "top 85%",
    stagger,
    opacity = 0
  } = options;

  useGSAP(() => {
    if (!ref.current) return;
    
    // Disable stagger or heavy animations on mobile if needed, but simple reveal is fine.
    const initialY = isMobile ? Math.min(y, 30) : y;
    
    gsap.fromTo(
      ref.current,
      { y: initialY, opacity },
      {
        y: 0,
        opacity: 1,
        duration: isMobile ? Math.min(duration, 0.6) : duration,
        delay,
        ease,
        stagger,
        scrollTrigger: {
          trigger: ref.current,
          start: triggerStart,
          toggleActions: "play none none reverse",
        },
      }
    );
  }, { scope: ref, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 2. Parallax Animation (Image moves slower than scroll)
// ----------------------------------------------------------------------
interface ParallaxOptions {
  speed?: number; // 0.5 means half speed, 2 means double speed
  direction?: "up" | "down";
}

export function useGsapParallax(
  ref: RefObject<HTMLElement | null>,
  options: ParallaxOptions = {}
) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { speed = 0.3, direction = "up" } = options;

  useGSAP(() => {
    if (!ref.current || isMobile) return; // Disable parallax on mobile for performance

    const yVal = direction === "up" ? -100 * speed : 100 * speed;

    gsap.to(ref.current, {
      yPercent: yVal,
      ease: "none",
      scrollTrigger: {
        trigger: ref.current,
        start: "top bottom", 
        end: "bottom top", 
        scrub: true,
      },
    });
  }, { scope: ref, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 3. Stagger Target Animation (Animate children sequentially)
// ----------------------------------------------------------------------
export function useGsapStagger(
  containerRef: RefObject<HTMLElement | null>,
  targetSelector: string,
  options: RevealOptions = {}
) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const {
    y = 30,
    duration = 0.6,
    delay = 0,
    ease = "power2.out",
    triggerStart = "top 80%",
    stagger = 0.1
  } = options;

  useGSAP(() => {
    if (!containerRef.current) return;
    
    const targets = containerRef.current.querySelectorAll(targetSelector);
    if (!targets.length) return;

    gsap.fromTo(
      targets,
      { y: isMobile ? 15 : y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        stagger,
        scrollTrigger: {
          trigger: containerRef.current,
          start: triggerStart,
          toggleActions: "play none none reverse",
        },
      }
    );
  }, { scope: containerRef, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 4. Horizontal Scroll Section
// ----------------------------------------------------------------------
export function useGsapHorizontalScroll(
  containerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>
) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  useGSAP(() => {
    if (!containerRef.current || !contentRef.current) return;

    const sections = gsap.utils.toArray(contentRef.current.children) as HTMLElement[];
    if (sections.length === 0) return;

    // Calculate total width to translate
    const totalWidth = contentRef.current.scrollWidth;
    const viewportWidth = window.innerWidth;
    const scrollAmount = totalWidth - viewportWidth;

    if (scrollAmount <= 0) return; // No need to scroll horizontally

    gsap.to(sections, {
      xPercent: -100 * (sections.length - 1),
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1, // Add slight delay for smoothness
        snap: isMobile ? 0 : 1 / (sections.length - 1),
        end: () => `+=${scrollAmount}`, 
      }
    });
  }, { scope: containerRef, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 5. Magnetic Hover Effect 
// ----------------------------------------------------------------------
export function useGsapMagnetic(
  ref: RefObject<HTMLElement | null>, 
  intensity: number = 0.3
) {
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    const xTo = gsap.quickTo(el, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(el, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = el.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      xTo(x * intensity);
      yTo(y * intensity);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: ref });
}
