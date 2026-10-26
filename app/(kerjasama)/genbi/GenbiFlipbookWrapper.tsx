"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import BlurText from "@/components/react-bits/text-blur";
import SplashCursor from "@/components/react-bits/splash-cursor";
import { motion, AnimatePresence } from "framer-motion";
import { GENBI_CONFIG } from "./constants";

const GenbiClientFlipbook = dynamic(() => import("./GenbiClientFlipbook"), {
  ssr: false,
});

const MIN_LOADING_MS = 4200;

/* ── Auto-dispatch synthetic mouse events for SplashCursor ── */
function useAutoSplash(active: boolean) {
  useEffect(() => {
    if (!active) return;

    let frame: number;
    let startTime = 0;
    let lastDispatch = 0;
    const DISPATCH_INTERVAL = 16;
    const DURATION = 2200;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (elapsed > DURATION) {
        return;
      }

      if (now - lastDispatch < DISPATCH_INTERVAL) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastDispatch = now;

      const progress = elapsed / DURATION;
      const t = 1 - Math.pow(1 - progress, 3);

      const w = window.innerWidth;
      const h = window.innerHeight;

      const sx = w * 0.1;
      const ex = w * 0.9;
      const y = h * 0.5;
      const x = sx + (ex - sx) * t;

      document.body.dispatchEvent(
        new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }),
      );

      frame = requestAnimationFrame(tick);
    };

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
export default function GenbiFlipbookWrapper({
  pdfUrl = GENBI_CONFIG.pdfUrl,
}: {
  pdfUrl?: string;
}) {
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
    <div className="relative w-full h-full overflow-hidden">
      {/* Flipbook preloaded hidden */}
      <div
        style={{
          opacity: showFlipbook ? 1 : 0,
          transition: "opacity 0.6s ease-in-out",
          pointerEvents: showFlipbook ? "auto" : "none",
        }}
        className="absolute inset-0"
      >
        <GenbiClientFlipbook
          pdfUrl={pdfUrl}
          onReady={() => setPdfReady(true)}
        />
      </div>

      {/* Loading screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="genbi-loader"
            className="absolute inset-0 z-50 bg-[#090d16] overflow-hidden flex flex-col justify-between"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* SplashCursor fluid dynamic background */}
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

            {/* ── 4 Constant Logos — top center ── */}
            <motion.div
              className="relative z-20 pt-8 sm:pt-12 px-4 flex flex-col items-center pointer-events-none"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <div className="flex items-center justify-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/15 shadow-2xl">
                {GENBI_CONFIG.logos.map((logo) => {
                  const isBI = logo.isFullRounded === false;
                  return (
                    <div
                      key={logo.name}
                      className={`flex items-center justify-center bg-white/95 shadow-md hover:scale-105 transition-transform overflow-hidden ${
                        isBI
                          ? "px-2 sm:px-3.5 py-1 sm:py-2 rounded-xl"
                          : "w-9 h-9 sm:w-12 sm:h-12 rounded-full p-1 sm:p-1.5 aspect-square"
                      }`}
                      title={logo.name}
                    >
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={80}
                        height={80}
                        className={`object-contain ${
                          isBI
                            ? "h-6 sm:h-9 w-auto max-w-[48px] sm:max-w-[76px]"
                            : "w-full h-full rounded-full"
                        }`}
                        priority
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* ── Center Content: Nama Kegiatan & Motto ── */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pointer-events-none -mt-4">
              {/* Badge Program */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-md"
              >
                <span>Proposal Program Kerja</span>
              </motion.div>

              {/* Title: GENABLE */}
              <BlurText
                text={GENBI_CONFIG.namaKegiatan}
                delay={80}
                animateBy="letters"
                direction="top"
                className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-center leading-tight justify-center drop-shadow-[0_10px_35px_rgba(99,102,241,0.35)]"
                stepDuration={0.4}
              />

              {/* Motto */}
              <div className="mt-4 max-w-2xl px-2">
                <BlurText
                  text={`"${GENBI_CONFIG.motto}"`}
                  delay={25}
                  animateBy="words"
                  direction="bottom"
                  className="text-indigo-200/80 text-sm sm:text-base md:text-lg text-center leading-relaxed justify-center font-medium italic"
                  stepDuration={0.3}
                />
              </div>

              {/* Progress bar + Loading dots */}
              <motion.div
                className="mt-8 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <div className="w-52 h-[2.5px] bg-white/10 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #6366f1, #38bdf8, #a855f7, #6366f1)",
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
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                  />
                </div>
                <p className="text-white/40 text-[11px] tracking-[0.25em] uppercase font-medium">
                  Menyiapkan Dokumen E-Proposal
                </p>
                <div className="flex gap-1.5 mt-2.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400/60"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.4, 0.8],
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

            {/* Bottom Footer Note */}
            <div className="relative z-20 pb-6 text-center text-[11px] text-white/30 tracking-wider">
              Karang Taruna Kelurahan Mojosongo · Surakarta
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
