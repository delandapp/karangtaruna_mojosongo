"use client";

/**
 * @author: @nuelst
 * @description: Card Flip - MVP Development Theme
 * @version: 1.1.0
 * @date: 2025-01-14
 * @license: MIT
 * @website: https://nueslt.vercel.app
 * @github: https://github.com/nuelst
 */

import { cn } from "@/lib/utils";
import { ArrowRight, Code2, Copy, Rocket, Zap } from "lucide-react";
import { useState } from "react";

export interface CardFlipProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  icon?: React.ReactNode;
  badge?: string;
  stat?: string;
  statLabel?: string;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
}

export default function CardFlip({
  title = "Build MVPs Fast",
  subtitle = "Launch your idea in record time",
  description = "Copy, paste, customize, and launch your MVP faster than ever with our developer-first component library.",
  features = [
    "Copy & Paste Ready",
    "Developer-First",
    "MVP Optimized",
    "Zero Setup Required",
  ],
  icon,
  badge,
  stat,
  statLabel,
  ctaText = "Start Building",
  ctaLink,
  className,
  frontContent,
  backContent,
}: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={cn(
        "group relative h-[360px] w-full [perspective:2000px]",
        className
      )}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]",
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(0deg)] [backface-visibility:hidden]",
            "overflow-hidden rounded-3xl",
            "bg-gradient-to-br from-white via-slate-50 to-slate-100",
            "dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-800",
            "border border-slate-200 dark:border-zinc-800/50",
            "shadow-lg dark:shadow-xl",
            "transition-all duration-700",
            "group-hover:shadow-xl dark:group-hover:shadow-2xl",
            "group-hover:border-emerald-500/30",
            isFlipped ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          {frontContent ? (
            frontContent
          ) : (
            <>
              {/* Background gradient effect */}
              <div className="from-primary/5 dark:from-primary/10 absolute inset-0 bg-gradient-to-br via-transparent to-blue-500/5 dark:to-blue-500/10" />

              {/* Animated code blocks */}
              <div className="absolute inset-0 flex items-center justify-center pt-20">
                <div className="relative flex h-[100px] w-[200px] flex-col items-center justify-center gap-2">
                  {/* Code blocks animation */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-3 w-full rounded-sm",
                        "from-primary/20 via-primary/30 to-primary/20 bg-gradient-to-r",
                        "animate-[slideIn_2s_ease-in-out_infinite]",
                        "opacity-0",
                      )}
                      style={{
                        width: `${60 + Math.random() * 40}%`,
                        animationDelay: `${i * 0.2}s`,
                        marginLeft: `${Math.random() * 20}%`,
                      }}
                    />
                  ))}

                  {/* Central rocket icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl",
                        "from-primary via-primary/90 to-primary/80 bg-gradient-to-br",
                        "flex items-center justify-center",
                        "shadow-primary/25 shadow-lg",
                        "animate-pulse",
                        "transition-all duration-500 group-hover:scale-110 group-hover:rotate-12",
                      )}
                    >
                      {icon || <Rocket className="h-6 w-6 text-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom content */}
              <div className="absolute right-0 bottom-0 left-0 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    {badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {badge}
                      </span>
                    )}
                    <h3 className="text-lg leading-snug font-semibold tracking-tight text-zinc-900 transition-all duration-500 ease-out group-hover:translate-y-[-4px] dark:text-white">
                      {title}
                    </h3>
                    <p className="line-clamp-2 text-sm tracking-tight text-zinc-600 transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px] dark:text-zinc-300">
                      {subtitle}
                    </p>
                  </div>
                  <div className="group/icon relative">
                    <div
                      className={cn(
                        "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                        "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent",
                        "opacity-0 group-hover/icon:opacity-100",
                      )}
                    />
                    <Zap className="text-primary relative z-10 h-5 w-5 transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:rotate-12" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(180deg)] [backface-visibility:hidden]",
            "rounded-3xl p-5",
            "bg-gradient-to-br from-white via-slate-50 to-slate-100",
            "dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-800",
            "border border-slate-200 dark:border-zinc-800",
            "shadow-lg dark:shadow-xl",
            "flex flex-col justify-between",
            "transition-all duration-700",
            "group-hover:shadow-xl dark:group-hover:shadow-2xl",
            "group-hover:border-emerald-500/30",
            !isFlipped ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          {backContent ? (
            backContent
          ) : (
            <>
              {/* Background gradient */}
              <div className="from-primary/5 dark:from-primary/10 absolute inset-0 rounded-2xl bg-gradient-to-br via-transparent to-blue-500/5 dark:to-blue-500/10" />

              <div className="relative z-10 flex-1 space-y-5">
                <div className="space-y-2">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-200">
                      {icon || <Code2 className="h-3.5 w-3.5" />}
                    </div>
                    <h3 className="text-base sm:text-lg leading-snug font-semibold tracking-tight text-zinc-900 transition-all duration-500 ease-out group-hover:translate-y-[-2px] dark:text-white">
                      {title}
                    </h3>
                  </div>
                  <p className="line-clamp-2 text-xs sm:text-sm tracking-tight text-zinc-600 transition-all duration-500 ease-out group-hover:translate-y-[-2px] dark:text-zinc-400 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {features.map((feature, index) => {
                    const icons = [Copy, Code2, Rocket, Zap];
                    const IconComponent = icons[index % icons.length];

                    return (
                      <div
                        key={feature}
                        className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700 transition-all duration-500 dark:text-zinc-300"
                        style={{
                          transform: isFlipped
                            ? "translateX(0)"
                            : "translateX(-10px)",
                          opacity: isFlipped ? 1 : 0,
                          transitionDelay: `${index * 100 + 200}ms`,
                        }}
                      >
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500">
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm leading-snug">{feature}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative z-10 mt-auto border-t border-slate-200 pt-4 dark:border-zinc-800">
                {ctaLink ? (
                  <a
                    href={ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group/start relative",
                      "flex items-center justify-between",
                      "rounded-lg p-2.5",
                      "transition-all duration-300",
                      "bg-gradient-to-r from-slate-100 via-slate-100 to-slate-100",
                      "dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800",
                      "hover:from-emerald-500/10 hover:via-emerald-500/5 hover:to-transparent",
                      "dark:hover:from-emerald-500/20 dark:hover:via-emerald-500/10 dark:hover:to-transparent",
                      "hover:scale-[1.02] hover:cursor-pointer",
                      "hover:border-emerald-500/20 border border-transparent",
                    )}
                  >
                    <span className="group-hover/start:text-emerald-600 text-sm font-semibold text-zinc-900 transition-colors duration-300 dark:text-white">
                      {ctaText}
                    </span>
                    <ArrowRight className="text-emerald-600 relative z-10 h-4 w-4 transition-all duration-300 group-hover/start:translate-x-1 group-hover/start:scale-110" />
                  </a>
                ) : (
                  <div
                    className={cn(
                      "group/start relative",
                      "flex items-center justify-between",
                      "rounded-lg p-2.5",
                      "transition-all duration-300",
                      "bg-gradient-to-r from-slate-100 via-slate-100 to-slate-100",
                      "dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800",
                      "hover:from-primary/10 hover:via-primary/5 hover:to-transparent",
                      "dark:hover:from-primary/20 dark:hover:via-primary/10 dark:hover:to-transparent",
                      "hover:scale-[1.02] hover:cursor-pointer",
                      "hover:border-primary/20 border border-transparent",
                    )}
                  >
                    <span className="group-hover/start:text-primary text-sm font-semibold text-zinc-900 transition-colors duration-300 dark:text-white">
                      {ctaText}
                    </span>
                    <div className="group/icon relative">
                      <div
                        className={cn(
                          "absolute inset-[-6px] rounded-lg transition-all duration-300",
                          "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent",
                          "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100",
                        )}
                      />
                      <ArrowRight className="text-primary relative z-10 h-4 w-4 transition-all duration-300 group-hover/start:translate-x-1 group-hover/start:scale-110" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          50% {
            transform: translateX(0);
            opacity: 0.8;
          }
          100% {
            transform: translateX(100px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
