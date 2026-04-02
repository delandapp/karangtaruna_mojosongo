"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Logo from "@/components/atoms/Logo";
import BlurText from "@/components/ui/text-blur";
import SplashCursor from "@/components/ui/splash-cursor";
import { motion, AnimatePresence } from "framer-motion";
import type { EProposal } from "@/features/api/eproposalApi";

const ClientFlipbook = dynamic(() => import("./ClientFlipbook"), {
  ssr: false,
});

const MIN_LOADING_MS = 5000;

/* ── Auto-dispatch synthetic mouse events for SplashCursor ──
   Single horizontal sweep from left to center-right 
   Throttled to ~60fps to prevent lag */
function useAutoSplash(active: boolean) {
  useEffect(() => {
    if (!active) return;

    let frame: number;
    let startTime = 0;
    let lastDispatch = 0;
    const DISPATCH_INTERVAL = 16;
    const DURATION = 2000; // 2 seconds for a single sweep

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed > DURATION) {
        return; // stop after sweeping once
      }

      if (now - lastDispatch < DISPATCH_INTERVAL) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastDispatch = now;

      // cubic ease-out
      const progress = elapsed / DURATION;
      const t = 1 - Math.pow(1 - progress, 3);

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Center left to center right sweep
      const sx = w * 0.1;
      const ex = w * 0.9;
      const y = h * 0.5;

      const x = sx + (ex - sx) * t;

      document.body.dispatchEvent(
        new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }),
      );

      frame = requestAnimationFrame(tick);
    };

    // Initial click to kick off the fluid
    const kickTimer = setTimeout(() => {
      document.body.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: window.innerWidth * 0.1,
          clientY: window.innerHeight * 0.5,
          bubbles: true,
        }),
      );

      frame = requestAnimationFrame(tick);
    }, 300);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(kickTimer);
    };
  }, [active]);
}

/* ── Main Wrapper ── */
export default function FlipbookWrapper({ proposal }: { proposal: EProposal }) {
  const [pdfReady, setPdfReady] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    const t = setTimeout(() => setMinTimePassed(true), remaining);
    return () => clearTimeout(t);
  }, []);

  const showFlipbook = pdfReady && minTimePassed;
  const isLoading = !showFlipbook;

  useAutoSplash(isLoading);

  return (
    <div className="relative w-full h-full">
      {/* Flipbook preloaded hidden */}
      <div
        style={{
          opacity: showFlipbook ? 1 : 0,
          transition: "opacity 0.6s ease-in-out",
          pointerEvents: showFlipbook ? "auto" : "none",
        }}
        className="absolute inset-0"
      >
        <ClientFlipbook proposal={proposal} onReady={() => setPdfReady(true)} />
      </div>

      {/* Loading screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            className="absolute inset-0 z-50 bg-[#0a0b10] overflow-hidden"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* SplashCursor — lower resolution for performance */}
            <SplashCursor
              SIM_RESOLUTION={64}
              DYE_RESOLUTION={512}
              DENSITY_DISSIPATION={3}
              VELOCITY_DISSIPATION={2}
              SPLAT_RADIUS={0.3}
              SPLAT_FORCE={5000}
              CURL={4}
              PRESSURE={0.15}
              BACK_COLOR={{ r: 0, g: 0, b: 0 }}
              TRANSPARENT={true}
              disableInteraction={true}
            />

            {/* ── Logo — top center ── */}
            <motion.div
              className="absolute top-10 left-1/2 z-20 -translate-x-1/2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Logo variant="with-text" theme="dark" size={50} />
              </motion.div>
            </motion.div>

            {/* ── Center content: BlurText title + subtitle ── */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pointer-events-none">
              {/* Title */}
              <BlurText
                text="Kolaborasi Strategis, Pertumbuhan Tanpa Batas."
                delay={60}
                animateBy="words"
                direction="top"
                className="text-white text-3xl sm:text-4xl md:text-5xl font-bold text-center leading-tight justify-center"
                stepDuration={0.4}
              />

              {/* Subtitle */}
              <div className="mt-5 max-w-2xl">
                <BlurText
                  text="Selamat datang di Portal Kemitraan Resmi kami. Temukan bagaimana kita bisa menghubungkan brand Anda dengan ribuan audiens potensial melalui eksekusi program yang terukur dan berdampak nyata."
                  delay={20}
                  animateBy="words"
                  direction="bottom"
                  className="text-white/50 text-sm sm:text-base md:text-lg text-center leading-relaxed justify-center font-light"
                  stepDuration={0.3}
                />
              </div>

              {/* Progress bar + dots */}
              <motion.div
                className="mt-10 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                <div className="w-48 h-[2px] bg-white/6 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #6366f1, #06b6d4, #6366f1)",
                      backgroundSize: "200% 100%",
                    }}
                    initial={{ width: "0%" }}
                    animate={{
                      width: "100%",
                      backgroundPosition: ["0% 0%", "200% 0%"],
                    }}
                    transition={{
                      width: {
                        duration: MIN_LOADING_MS / 1000,
                        ease: "easeInOut",
                      },
                      backgroundPosition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                  />
                </div>
                <p className="text-white/30 text-xs tracking-[0.25em] uppercase">
                  Menyiapkan E-Proposal
                </p>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-indigo-400/40"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.3, 0.8],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
