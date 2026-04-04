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
          toggleActions: "play none none none",
          once: true
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
          toggleActions: "play none none none",
          once: true
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

    gsap.to(contentRef.current, {
      x: () => -scrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1, 
        end: () => `+=${scrollAmount}`, 
      }
    });
  }, { scope: containerRef, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 6. Scrub Text Reveal (Clip path along scroll)
// ----------------------------------------------------------------------
export function useGsapScrubText(
  ref: RefObject<HTMLElement | null>,
  options: { start?: string; end?: string; direction?: "left-to-right" | "bottom-to-top" } = {}
) {
  useGSAP(() => {
    if (!ref.current) return;
    const { start = "top 90%", end = "bottom 60%", direction = "left-to-right" } = options;

    const clipPathStart = direction === "left-to-right" ? "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" : "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)";
    const clipPathEnd = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";

    gsap.fromTo(
      ref.current,
      { clipPath: clipPathStart },
      {
        clipPath: clipPathEnd,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start,
          end,
          scrub: 1,
        },
      }
    );
  }, { scope: ref });
}

// ----------------------------------------------------------------------
// 7. Pin Section with Progress
// ----------------------------------------------------------------------
export function useGsapPinSection(
  ref: RefObject<HTMLElement | null>,
  options: { end?: string } = {}
) {
  useGSAP(() => {
    if (!ref.current) return;
    const { end = "+=100%" } = options;
    ScrollTrigger.create({
      trigger: ref.current,
      start: "top top",
      end,
      pin: true,
      pinSpacing: true,
    });
  }, { scope: ref });
}

// ----------------------------------------------------------------------
// 8. Count Up Number
// ----------------------------------------------------------------------
export function useGsapCountUp(
  ref: RefObject<HTMLElement | null>,
  target: number,
  options: { duration?: number; suffix?: string } = {}
) {
  useGSAP(() => {
    if (!ref.current) return;
    const { duration = 2, suffix = "" } = options;
    const obj = { val: 0 };
    
    gsap.to(obj, {
      val: target,
      duration,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        toggleActions: "play none none none",
        once: true
      },
      onUpdate: () => {
        if (ref.current) {
          ref.current.innerText = Math.floor(obj.val) + suffix;
        }
      }
    });
  }, { scope: ref });
}

// ----------------------------------------------------------------------
// 9. Card 3D Tilt
// ----------------------------------------------------------------------
export function useGsapCardTilt(ref: RefObject<HTMLElement | null>, amount = 15) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  useGSAP(() => {
    if (!ref.current || isMobile) return;
    
    const card = ref.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      const y = e.clientY - rect.top; 
      
      const xPct = x / rect.width - 0.5;
      const yPct = y / rect.height - 0.5;
      
      gsap.to(card, {
        rotateY: xPct * amount,
        rotateX: -yPct * amount,
        transformPerspective: 1000,
        ease: "power2.out",
        duration: 0.5
      });
    };
    
    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        ease: "power2.out",
        duration: 0.5
      });
    };
    
    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, { scope: ref, dependencies: [isMobile] });
}

// ----------------------------------------------------------------------
// 10. Magnetic Hover Effect
// ----------------------------------------------------------------------
export function useGsapMagnetic(
  ref: React.RefObject<HTMLElement | null>, 
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
