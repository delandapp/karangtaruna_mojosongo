"use client";

import React, { useRef } from "react";
import { useGsapMagnetic } from "@/lib/hooks/useGsapAnimation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  intensity?: number;
}

export function MagneticButton({
  children,
  href,
  variant = "primary",
  size = "md",
  intensity = 0.3,
  className,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  
  // Apply magnetic effect
  useGsapMagnetic(ref as React.RefObject<HTMLElement>, intensity);

  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden group rounded-full";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-8 text-sm",
    lg: "h-14 px-10 text-base",
  };

  const combinedClasses = cn(baseStyles, variants[variant], sizes[size], className);

  // Decorative inner element for hover animation
  const Decor = () => (
    <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300 ease-out origin-center block z-0" />
  );

  const InnerContent = () => (
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  );

  if (href) {
    return (
      <Link href={href} legacyBehavior passHref>
        <a ref={ref as React.RefObject<HTMLAnchorElement>} className={combinedClasses}>
          <Decor />
          <InnerContent />
        </a>
      </Link>
    );
  }

  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} className={combinedClasses} {...props}>
      <Decor />
      <InnerContent />
    </button>
  );
}
