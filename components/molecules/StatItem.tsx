"use client";

import React, { useRef } from "react";
import { CounterNumber } from "../atoms/CounterNumber";
import { cn } from "@/lib/utils";
import { useGsapReveal } from "@/lib/hooks/useGsapAnimation";

interface StatItemProps {
  number: number;
  label: string;
  suffix?: string;
  icon?: React.ReactNode;
  index: number;
}

export function StatItem({ number, label, suffix = "", icon, index }: StatItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGsapReveal(ref, { delay: index * 0.15, y: 40 });

  return (
    <div ref={ref} className="flex flex-col items-center justify-center text-center p-6 gap-3">
      {icon && (
        <div className="text-primary-400 mb-2">
          {icon}
        </div>
      )}
      <h4 className="text-5xl md:text-7xl font-bold font-title tracking-tighter text-foreground drop-shadow-sm flex items-center">
        <CounterNumber end={number} suffix={suffix} duration={2.5} />
      </h4>
      <p className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-widest px-4 border-t border-border/50 pt-4 mt-2">
        {label}
      </p>
    </div>
  );
}
