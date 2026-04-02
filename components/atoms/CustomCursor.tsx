"use client";

import React, { useRef } from "react";
import { useCursorFollower } from "@/lib/hooks/useCursorFollower";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useCursorFollower(dotRef, ringRef);

  return (
    <div className="custom-cursor-container hidden md:block">
      {/* Outer Ring */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-primary/50 bg-primary/10 backdrop-blur-sm pointer-events-none z-9999 opacity-0 transition-opacity duration-300 -translate-x-1/2 -translate-y-1/2"
      />
      {/* Inner Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-primary pointer-events-none z-10000 opacity-0 transition-opacity duration-300 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
}
