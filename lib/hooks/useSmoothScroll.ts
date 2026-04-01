"use client";

import { useCallback } from "react";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";

// Register ScrollToPlugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollToPlugin);
}

export function useSmoothScroll() {
  const scrollTo = useCallback((target: string | number, options: { duration?: number; offset?: number; ease?: string } = {}) => {
    const { duration = 1, offset = 0, ease = "power3.inOut" } = options;

    if (typeof target === "string") {
      // Find element by id or selector
      const el = document.querySelector(target);
      if (el) {
        gsap.to(window, {
          duration,
          scrollTo: { y: el, autoKill: true, offsetY: offset },
          ease,
        });
      }
    } else if (typeof target === "number") {
      gsap.to(window, {
        duration,
        scrollTo: { y: target, autoKill: true, offsetY: offset },
        ease,
      });
    }
  }, []);

  const scrollToTop = useCallback((duration = 1) => {
    scrollTo(0, { duration });
  }, [scrollTo]);

  return { scrollTo, scrollToTop };
}
