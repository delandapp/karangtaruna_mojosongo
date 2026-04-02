"use client";

import { useEffect, RefObject } from "react";
import gsap from "gsap";
import { useMediaQuery } from "./useMediaQuery";

export function useCursorFollower(
  dotRef: RefObject<HTMLElement | null>,
  ringRef: RefObject<HTMLElement | null>
) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (isMobile || !dotRef.current || !ringRef.current) return;

    const dot = dotRef.current;
    const ring = ringRef.current;

    gsap.set(dot, { xPercent: -50, yPercent: -50, top: 0, left: 0 });
    gsap.set(ring, { xPercent: -50, yPercent: -50, top: 0, left: 0 });

    const xToDot = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const yToDot = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });

    const xToRing = gsap.quickTo(ring, "x", { duration: 0.3, ease: "power3" });
    const yToRing = gsap.quickTo(ring, "y", { duration: 0.3, ease: "power3" });

    const moveCursor = (e: MouseEvent) => {
      xToDot(e.clientX);
      yToDot(e.clientY);
      xToRing(e.clientX);
      yToRing(e.clientY);
    };

    const handleMouseLeaveWindow = () => {
      gsap.to([dot, ring], { opacity: 0, duration: 0.3 });
    };

    const handleMouseEnterWindow = () => {
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
    };

    // Make ring bigger on hover over clickable elements
    const handleHoverStart = () => {
      gsap.to(ring, { scale: 1.5, borderColor: "var(--color-primary-500)", backgroundColor: "rgba(0, 188, 106, 0.1)", duration: 0.3 });
      gsap.to(dot, { scale: 0, duration: 0.3 });
    };

    const handleHoverEnd = () => {
      gsap.to(ring, { scale: 1, borderColor: "var(--color-foreground)", backgroundColor: "transparent", duration: 0.3 });
      gsap.to(dot, { scale: 1, duration: 0.3 });
    };

    window.addEventListener("mousemove", moveCursor);
    document.body.addEventListener("mouseleave", handleMouseLeaveWindow);
    document.body.addEventListener("mouseenter", handleMouseEnterWindow);

    // Apply mutation observer to handle dynamically added interactive elements
    const applyHoverListeners = () => {
      const interactiveElements = document.querySelectorAll(
        "a, button, input, select, textarea, [role='button'], [tabindex='0']"
      );
      
      interactiveElements.forEach((el) => {
        // avoid re-attaching
        const htmlEl = el as HTMLElement;
        if (!htmlEl.dataset.cursorAttached) {
          htmlEl.dataset.cursorAttached = "true";
          el.addEventListener("mouseenter", handleHoverStart);
          el.addEventListener("mouseleave", handleHoverEnd);
        }
      });
    };

    applyHoverListeners();

    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) shouldReapply = true;
      });
      if (shouldReapply) applyHoverListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.body.removeEventListener("mouseleave", handleMouseLeaveWindow);
      document.body.removeEventListener("mouseenter", handleMouseEnterWindow);
      observer.disconnect();
      
      document.querySelectorAll("[data-cursor-attached]").forEach(el => {
        el.removeEventListener("mouseenter", handleHoverStart);
        el.removeEventListener("mouseleave", handleHoverEnd);
        delete (el as HTMLElement).dataset.cursorAttached;
      });
    };
  }, [isMobile]);
}
