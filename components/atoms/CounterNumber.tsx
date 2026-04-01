"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

interface CounterNumberProps {
  end: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CounterNumber({
  end,
  duration = 2,
  delay = 0,
  suffix = "",
  prefix = "",
  className,
}: CounterNumberProps) {
  const counterRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!counterRef.current || !containerRef.current) return;

    // We animate a dummy object and update the text content onUpdate
    const obj = { val: 0 };

    gsap.to(obj, {
      val: end,
      duration,
      delay,
      ease: "power2.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 90%", // Start when element enters viewport
        once: true, // Only animate once
      },
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.innerHTML = Math.floor(obj.val).toString();
        }
      },
    });
  }, { scope: containerRef, dependencies: [end] });

  return (
    <span ref={containerRef} className={cn("inline-flex items-center", className)}>
      {prefix && <span>{prefix}</span>}
      <span ref={counterRef}>0</span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
