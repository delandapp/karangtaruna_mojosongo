import { useState, useEffect } from "react";

interface ScrollPosition {
  scrollY: number;
  scrollX: number;
  direction: "up" | "down" | "none";
  progress: number;
}

export function useScrollPosition(): ScrollPosition {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollY: 0,
    scrollX: 0,
    direction: "none",
    progress: 0,
  });

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.pageYOffset;
      const scrollX = window.pageXOffset;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = documentHeight > 0 ? scrollY / documentHeight : 0;
      
      const direction = scrollY > lastScrollY ? "down" : scrollY < lastScrollY ? "up" : "none";
      lastScrollY = scrollY > 0 ? scrollY : 0;

      setScrollPosition({ scrollY, scrollX, direction, progress });
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    updateScrollDir();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrollPosition;
}
