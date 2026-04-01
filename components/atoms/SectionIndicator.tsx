"use client";

import React, { useEffect, useState } from "react";
import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface SectionIndicatorProps {
  sections: Section[];
  className?: string;
}

export function SectionIndicator({ sections, className }: SectionIndicatorProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "");
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    // Basic active section detection
    const handleScroll = () => {
      let current = activeSection;
      
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If top is above middle of screen and bottom is below top of screen
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
            current = section.id;
          }
        }
      }

      if (current !== activeSection) {
        setActiveSection(current);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Init

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections, activeSection]);

  if (!sections.length) return null;

  return (
    <div className={cn("fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3", className)}>
      {sections.map((sec) => {
        const isActive = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            onClick={() => scrollTo(`#${sec.id}`)}
            className="group relative flex items-center justify-end right-0 outline-none p-2"
            aria-label={`Scroll to ${sec.label}`}
          >
            {/* Label wrapper */}
            <span className={cn(
              "absolute right-6 mr-2 text-xs font-medium whitespace-nowrap transition-all duration-300",
              isActive 
                ? "opacity-100 text-foreground translate-x-0" 
                : "opacity-0 text-muted-foreground translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            )}>
              {sec.label}
            </span>
            
            {/* Dot */}
            <span 
              className={cn(
                "block rounded-full transition-all duration-300 ease-out z-10",
                isActive 
                  ? "w-2.5 h-6 bg-primary" 
                  : "w-2 h-2 bg-muted-foreground/40 group-hover:bg-primary/60 group-hover:scale-150"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
