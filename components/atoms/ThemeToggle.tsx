"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // SSR placeholder to avoid hydration mismatch
    return (
      <div
        className={cn(
          "rounded-full bg-muted",
          size === "sm" && "size-8",
          size === "md" && "size-9",
          size === "lg" && "size-10",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  const sizeClasses = {
    sm: "size-8",
    md: "size-9",
    lg: "size-10",
  };

  const iconSizes = {
    sm: "size-4",
    md: "size-[18px]",
    lg: "size-5",
  };

  const toggleTheme = () => {
    setIsAnimating(true);

    // Add transitioning class for smooth global transition
    document.documentElement.classList.add("transitioning");

    setTheme(isDark ? "light" : "dark");

    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
      setIsAnimating(false);
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full",
        "border border-border bg-background",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        "transition-all duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "cursor-pointer",
        sizeClasses[size],
        className,
      )}
    >
      {/* Sun icon */}
      <Sun
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-500 ease-in-out",
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100",
        )}
      />
      {/* Moon icon */}
      <Moon
        className={cn(
          iconSizes[size],
          "absolute transition-all duration-500 ease-in-out",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0",
        )}
      />

      {/* Ripple effect on click */}
      {isAnimating && (
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
      )}
    </button>
  );
}
