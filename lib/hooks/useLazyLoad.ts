import { useRef, useEffect, useState } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver";

export function useLazyLoad(rootMargin: string = "200px") {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const entry = useIntersectionObserver(ref, {
    rootMargin,
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      setIsVisible(true);
    }
  }, [entry]);

  return { ref, isVisible };
}
