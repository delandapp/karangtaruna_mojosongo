"use client";

if (typeof globalThis !== "undefined") {
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {};
  }
  if (typeof (globalThis as any).Path2D === "undefined") {
    (globalThis as any).Path2D = class Path2D {};
  }
}

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Maximize,
  ZoomIn,
  ZoomOut,
  ListOrdered,
  X,
  BookOpen,
  Download,
  AlertCircle,
  Home,
  RotateCcw,
  Book,
  Columns,
  CheckCircle2,
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GENBI_CONFIG } from "./constants";

const PDF_VERSION = pdfjs?.version || "5.4.296";
const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/build/pdf.worker.min.mjs`;

if (typeof window !== "undefined" && pdfjs?.GlobalWorkerOptions) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  } catch {}
}

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDF_VERSION}/standard_fonts/`,
};

/* ── 3D Hard Flip Page Wrapper (Hardware accelerated, No Canvas Cloning) ── */
// Build optimization: pdfjs-dist minified export
interface FlipPageProps {
  children: React.ReactNode;
  number?: number;
  isLeft?: boolean;
  isRight?: boolean;
  isCover?: boolean;
  isBackCover?: boolean;
}

const FlipPage = React.forwardRef<HTMLDivElement, FlipPageProps>(
  ({ children, number, isLeft, isRight, isCover, isBackCover }, ref) => (
    <div
      ref={ref}
      className={`flip-page bg-white overflow-hidden relative ${
        isCover ? "flip-cover-front" : isBackCover ? "flip-cover-back" : ""
      }`}
      data-density="hard"
    >
      <div className="h-full w-full relative">{children}</div>

      {/* ── Realistic Spine Crease Shadow for Left Pages ── */}
      {isLeft && !isBackCover && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 z-10"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.02) 60%, rgba(0, 0, 0, 0.12) 100%)",
          }}
        />
      )}

      {/* ── Realistic Spine Crease Shadow for Right Pages ── */}
      {isRight && !isCover && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-10 z-10"
          style={{
            background:
              "linear-gradient(to left, transparent 0%, rgba(0, 0, 0, 0.02) 60%, rgba(0, 0, 0, 0.12) 100%)",
          }}
        />
      )}

      {/* ── Front Cover Spine Binding Accent (Left Edge) ── */}
      {isCover && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-5 z-10"
            style={{
              background:
                "linear-gradient(to right, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)",
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 left-[18px] w-px z-10 bg-black/15" />
        </>
      )}

      {/* ── Back Cover Spine Binding Accent (Right Edge) ── */}
      {isBackCover && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-5 z-10"
            style={{
              background:
                "linear-gradient(to left, rgba(0, 0, 0, 0.22) 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)",
            }}
          />
          <div className="pointer-events-none absolute inset-y-0 right-[18px] w-px z-10 bg-black/15" />
        </>
      )}

      {/* ── Page number (interior pages only) ── */}
      {number !== undefined && !isCover && !isBackCover && (
        <span
          className={`absolute bottom-2.5 z-20 text-[10px] text-neutral-400 font-medium tracking-widest select-none ${
            isLeft ? "left-4" : "right-4"
          }`}
        >
          {number}
        </span>
      )}
    </div>
  ),
);
FlipPage.displayName = "FlipPage";

/* ── Main Component ── */
export default function GenbiClientFlipbook({
  pdfUrl = GENBI_CONFIG.pdfUrl,
  onReady,
}: {
  pdfUrl?: string;
  onReady?: () => void;
}) {
  const [numPages, setNumPages] = useState(14);
  const [currentPage, setCurrentPage] = useState(0); // 0-based spread index reported by react-pageflip
  const [mobilePage, setMobilePage] = useState(1); // 1-based active page on mobile (1..numPages)
  const [mobileOverview, setMobileOverview] = useState(false); // toggle 2-page overview on mobile
  const [isDocLoaded, setIsDocLoaded] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 500, height: 707 });
  const [tocOpen, setTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const flipBookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookAreaRef = useRef<HTMLDivElement>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const daftarIsi = GENBI_CONFIG.daftarIsi;
  const hasToc = daftarIsi.length > 0;

  /* ── Responsive check & TOC drawer initial state ── */
  useEffect(() => {
    if (typeof window !== "undefined" && pdfjs?.GlobalWorkerOptions) {
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      } catch {}
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    if (!mq.matches && daftarIsi.length) {
      setTocOpen(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches && daftarIsi.length) setTocOpen(true);
      else setTocOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [daftarIsi]);

  /* ── Dimensions calculation: exact A4 aspect ratio ── */
  const calculateDimensions = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMob = vw <= 768;
    setIsMobile(isMob);

    // Exact A4 aspect ratio from PDF MediaBox (595.5 / 842.25)
    const ratio = 595.5 / 842.25;

    const topBarH = isMob ? 50 : 56;
    const toolbarH = isMob ? 46 : 48;
    const paddingV = isMob ? 16 : 28;
    const availH = Math.max(vh - toolbarH - topBarH - paddingV, 200);

    if (isMob) {
      // Mobile: single page width fits mobile screen with comfortable margins
      const maxW = Math.min(vw - 24, 460);
      let pageW = maxW;
      let pageH = Math.round(pageW / ratio);

      if (pageH > availH) {
        pageH = Math.floor(availH);
        pageW = Math.round(pageH * ratio);
      }

      pageW = Math.max(pageW, 200);
      pageH = Math.max(pageH, 283);

      setDimensions({ width: pageW, height: pageH });
    } else {
      // Desktop: 2-page landscape spread fits comfortably
      let pageH = Math.floor(availH * 0.94);
      let pageW = Math.round(pageH * ratio);

      const maxArea = Math.floor((vw - 40) * 0.95);
      if (pageW * 2 > maxArea) {
        pageW = Math.floor(maxArea / 2);
        pageH = Math.round(pageW / ratio);
      }

      pageW = Math.max(pageW, 240);
      pageH = Math.max(pageH, 339);

      setDimensions({ width: pageW, height: pageH });
    }
  }, []);

  useEffect(() => {
    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);
    return () => window.removeEventListener("resize", calculateDimensions);
  }, [calculateDimensions]);

  /* ── Sound effect ── */
  const playFlipSound = useCallback(() => {
    try {
      const s = new Audio("/sound/effect/flip_effect.mp3");
      s.volume = 0.35;
      s.play().catch(() => {});
    } catch {}
  }, []);

  /* ── Helper: Map 1-based page number (1..14) to StPageFlip spread index ── */
  const getSpreadForPage = useCallback(
    (pageNum: number) => {
      if (pageNum <= 1) return 0;
      if (pageNum >= numPages) return numPages - 1;
      const idx = pageNum - 1;
      // StPageFlip spreads with showCover=true:
      // spread 0: [0]
      // spread 1: [1, 2] -> returns 1
      // spread 2: [3, 4] -> returns 3
      // spread 3: [5, 6] -> returns 5
      // spread 4: [7, 8] -> returns 7
      // spread 5: [9, 10] -> returns 9
      // spread 6: [11, 12] -> returns 11
      // spread 7: [13] -> returns 13
      return idx % 2 === 1 ? idx : idx - 1;
    },
    [numPages],
  );

  /* ── StPageFlip onFlip handler ── */
  const onFlip = useCallback(
    (e: any) => {
      const newPageIdx = e.data;
      setCurrentPage(newPageIdx);
      playFlipSound();

      if (isMobile) {
        setMobilePage((prevMobile) => {
          if (newPageIdx === 0) return 1;
          if (newPageIdx >= numPages - 1) return numPages;

          const prevSpread = getSpreadForPage(prevMobile);
          if (newPageIdx > prevSpread) {
            // Moved forward -> land on Left page of new spread
            return newPageIdx + 1;
          } else if (newPageIdx < prevSpread) {
            // Moved backward -> land on Right page of new spread
            return newPageIdx + 2;
          }
          return prevMobile;
        });
      }
    },
    [isMobile, numPages, getSpreadForPage, playFlipSound],
  );

  /* ── Document loader callbacks ── */
  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setIsDocLoaded(true);
    setDocError(null);
    onReady?.();
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("Gagal memuat PDF GenBI:", err);
    setDocError(err.message || "File PDF proposal tidak ditemukan");
    setIsDocLoaded(true);
    onReady?.();
  };

  /* ── Navigation logic ── */
  const isAtFrontCover = isMobile ? mobilePage === 1 : currentPage === 0;
  const isAtEnd = isMobile
    ? mobilePage >= numPages
    : currentPage >= numPages - 1;

  const goNext = useCallback(() => {
    if (isMobile) {
      if (mobilePage >= numPages) return;

      if (mobilePage === 1) {
        // From Cover (1) -> Page 2 (Left page of Spread 1)
        setMobilePage(2);
        flipBookRef.current?.pageFlip()?.flip(1);
        playFlipSound();
      } else if (mobilePage % 2 === 0) {
        // Currently on an EVEN page (Page 2, 4, 6, 8, 10, 12) = Left page of open spread
        // Smoothly pan camera to Right page (3, 5, 7, 9, 11, 13)
        setMobilePage((p) => p + 1);
      } else {
        // Currently on an ODD page (Page 3, 5, 7, 9, 11, 13) = Right page of open spread
        // Flip to next spread (or back cover)
        const targetPage = mobilePage + 1;
        setMobilePage(targetPage);
        const targetSpread = getSpreadForPage(targetPage);
        flipBookRef.current?.pageFlip()?.flip(targetSpread);
        playFlipSound();
      }
    } else {
      if (isAtEnd) return;
      flipBookRef.current?.pageFlip()?.flipNext();
      playFlipSound();
    }
  }, [isMobile, mobilePage, numPages, isAtEnd, getSpreadForPage, playFlipSound]);

  const goPrev = useCallback(() => {
    if (isMobile) {
      if (mobilePage <= 1) return;

      if (mobilePage === numPages) {
        // From Back Cover (14) -> Page 13 (Right page of Spread 6)
        setMobilePage(numPages - 1);
        const targetSpread = getSpreadForPage(numPages - 1);
        flipBookRef.current?.pageFlip()?.flip(targetSpread);
        playFlipSound();
      } else if (mobilePage % 2 === 1) {
        // Currently on an ODD page (Page 3, 5, 7, 9, 11, 13) = Right page
        // Smoothly pan camera back to Left page (2, 4, 6, 8, 10, 12)
        setMobilePage((p) => p - 1);
      } else {
        // Currently on an EVEN page (Page 2, 4, 6, 8, 10, 12) = Left page
        // Flip back to previous spread (or cover)
        const targetPage = mobilePage - 1;
        setMobilePage(targetPage);
        const targetSpread = getSpreadForPage(targetPage);
        flipBookRef.current?.pageFlip()?.flip(targetSpread);
        playFlipSound();
      }
    } else {
      if (currentPage <= 0) return;
      flipBookRef.current?.pageFlip()?.flipPrev();
      playFlipSound();
    }
  }, [isMobile, mobilePage, numPages, currentPage, getSpreadForPage, playFlipSound]);

  const goFirst = useCallback(() => {
    if (isMobile) {
      setMobilePage(1);
      flipBookRef.current?.pageFlip()?.flip(0);
      playFlipSound();
    } else {
      flipBookRef.current?.pageFlip()?.flip(0);
      playFlipSound();
    }
  }, [isMobile, playFlipSound]);

  const goLast = useCallback(() => {
    // Automatically close proposal to Back Cover
    const lastPageIdx = numPages - 1;
    if (isMobile) {
      setMobilePage(numPages);
      flipBookRef.current?.pageFlip()?.flip(lastPageIdx);
      playFlipSound();
    } else {
      flipBookRef.current?.pageFlip()?.flip(lastPageIdx);
      playFlipSound();
    }
  }, [isMobile, numPages, playFlipSound]);

  const navigateToPage = useCallback(
    (targetHalaman: number) => {
      if (targetHalaman < 1 || targetHalaman > numPages) return;

      if (isMobile) {
        setMobilePage(targetHalaman);
        const targetSpread = getSpreadForPage(targetHalaman);
        const currentSpread = flipBookRef.current?.pageFlip()?.getCurrentPageIndex();
        if (currentSpread !== targetSpread) {
          flipBookRef.current?.pageFlip()?.flip(targetSpread);
          playFlipSound();
        }
        setTocOpen(false);
      } else {
        const targetSpread = getSpreadForPage(targetHalaman);
        flipBookRef.current?.pageFlip()?.flip(targetSpread);
        playFlipSound();
      }
    },
    [isMobile, numPages, getSpreadForPage, playFlipSound],
  );

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  /* ── Touch gestures on mobile ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  /* ── Fullscreen toggle ── */
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement)
        await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  useEffect(() => {
    const onFs = () => setTimeout(calculateDimensions, 100);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [calculateDimensions]);

  /* ── Zoom controls ── */
  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));
  const resetZoom = () => setZoom(1);

  /* ── Current Section from Daftar Isi for active display ── */
  const currentSection = useMemo(() => {
    const activeNum = isMobile
      ? mobilePage
      : currentPage === 0
        ? 1
        : currentPage >= numPages - 1
          ? numPages
          : currentPage + 1;

    return (
      daftarIsi.find(
        (item) =>
          activeNum >= item.halaman &&
          activeNum <= (item.halamanAkhir || item.halaman),
      ) || daftarIsi[0]
    );
  }, [isMobile, mobilePage, currentPage, numPages, daftarIsi]);

  /* ── Camera translation & viewport auto-zoom calculation ── */
  const spreadWidth = dimensions.width * 2;

  let translateX = 0;
  if (isMobile) {
    if (mobileOverview) {
      translateX = 0;
    } else {
      // Auto-zoom to active page on mobile:
      if (mobilePage === 1) {
        // Front Cover is on right half -> shift left to center Front Cover
        translateX = -dimensions.width / 2;
      } else if (mobilePage >= numPages) {
        // Back Cover is on left half -> shift right to center Back Cover
        translateX = dimensions.width / 2;
      } else if (mobilePage % 2 === 0) {
        // Even page (2, 4, 6...) is the LEFT page -> shift right to center Left page
        translateX = dimensions.width / 2;
      } else {
        // Odd page (3, 5, 7...) is the RIGHT page -> shift left to center Right page
        translateX = -dimensions.width / 2;
      }
    }
  } else {
    // Desktop centering:
    if (currentPage === 0) {
      // Front Cover is on right half -> shift left
      translateX = -dimensions.width / 2;
    } else if (currentPage >= numPages - 1) {
      // Back Cover is on left half -> shift right
      translateX = dimensions.width / 2;
    } else {
      // Open 2-page spread -> centered
      translateX = 0;
    }
  }

  // Calculate final scale:
  let finalScale = zoom;
  if (isMobile && mobileOverview) {
    const fitSpreadScale = Math.min((window.innerWidth - 24) / spreadWidth, 1);
    finalScale = fitSpreadScale * zoom;
  }

  const isOpenSpread = isMobile
    ? !mobileOverview && mobilePage > 1 && mobilePage < numPages
    : currentPage > 0 && currentPage < numPages - 1;

  /* ── Colors ── */
  const bgColor = isDark ? "#0c111c" : "#e8ecf2";
  const headerBg = isDark
    ? "bg-[#0b101b]/95 border-b border-white/[0.08]"
    : "bg-white/95 border-b border-slate-200";
  const toolbarBg = isDark
    ? "bg-[#0f172a]/95 border-white/[0.1] shadow-2xl"
    : "bg-[#1e293b]/95 border-white/10 shadow-2xl";
  const btnBase = "text-white/70 hover:text-white hover:bg-white/10 active:scale-95";
  const btnDisabledCls = "text-white/20 pointer-events-none";

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full relative select-none transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Top Bar: Logo Partner Konstan + Identitas Kegiatan ── */}
      <header
        className={`shrink-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2 backdrop-blur-md transition-colors duration-300 ${headerBg}`}
      >
        {/* Left: Home link + 4 Logos */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Beranda"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />

          {/* 4 Logos Container */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-xl bg-white/90 dark:bg-white/95 shadow-xs border border-slate-200/80 dark:border-white/20">
            {GENBI_CONFIG.logos.map((logo) => {
              const isBI = logo.isFullRounded === false;
              return (
                <div
                  key={logo.name}
                  className={`relative flex items-center justify-center shrink-0 ${
                    isBI
                      ? "px-1 sm:px-1.5 py-0.5 rounded-md"
                      : "w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-white shadow-xs p-0.5 aspect-square"
                  }`}
                  title={logo.name}
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={60}
                    height={60}
                    className={`object-contain ${
                      isBI
                        ? "h-4 sm:h-6 w-auto max-w-[40px] sm:max-w-[60px]"
                        : "w-full h-full rounded-full"
                    }`}
                    priority
                  />
                </div>
              );
            })}
          </div>

          {/* Title tag */}
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide truncate">
              {GENBI_CONFIG.namaKegiatan}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-white/50 truncate max-w-xs">
              {GENBI_CONFIG.motto}
            </span>
          </div>
        </div>

        {/* Right: Badge Proposal + Action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/20">
            Proposal Kerjasama
          </span>

          <a
            href={pdfUrl}
            download="Proposal-GENABLE.pdf"
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title="Download PDF Proposal"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unduh PDF</span>
          </a>
        </div>
      </header>

      {/* ── Main area: Sidebar TOC + Book area ── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Desktop Sidebar (md+) */}
        {hasToc && !isMobile && (
          <div
            className="shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out"
            style={{ width: tocOpen ? 280 : 0 }}
          >
            <div
              className="w-[280px] h-full flex flex-col border-r border-white/[0.08]"
              style={{ backgroundColor: isDark ? "#0f172a" : "#1e293b" }}
            >
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white/90 tracking-wide">
                    Daftar Isi Proposal
                  </span>
                </div>
                <button
                  onClick={() => setTocOpen(false)}
                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
                {daftarIsi.map((item, idx) => {
                  const startPage = item.halaman;
                  const endPage = item.halamanAkhir || item.halaman;
                  const leftPage = currentPage === 0 ? 1 : currentPage + 1;
                  const rightPage = currentPage === 0 ? 1 : currentPage + 2;
                  const isActive =
                    (leftPage >= startPage && leftPage <= endPage) ||
                    (rightPage >= startPage && rightPage <= endPage);

                  return (
                    <button
                      key={`${item.urutan}-${item.judul}`}
                      onClick={() => navigateToPage(item.halaman)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300 font-medium"
                          : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-500/30 text-indigo-300"
                            : "bg-white/[0.05] text-white/40 group-hover:text-white/60"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate leading-tight">
                        {item.judul}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] tabular-nums transition-colors ${
                          isActive
                            ? "text-indigo-400 font-semibold"
                            : "text-white/30 group-hover:text-white/40"
                        }`}
                      >
                        {item.labelHalaman || `Hal ${item.halaman}`}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="shrink-0 px-4 py-2.5 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/40 text-center">
                  GENABLE · {numPages} Halaman Proposal
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Book Area */}
        <div
          ref={bookAreaRef}
          className="flex-1 relative min-h-0 flex items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {docError ? (
            <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                File PDF Belum Siap
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Pastikan file PDF proposal telah diletakkan di lokasi:
                <code className="block mt-2 p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-indigo-500 break-all">
                  public/pdf/genbi-proposal.pdf
                </code>
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                Muat Ulang Halaman
              </button>
            </div>
          ) : (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: spreadWidth,
                height: dimensions.height,
                transform: `translate(-50%, -50%) scale(${finalScale}) translate(${translateX}px, 0px)`,
                transformOrigin: "center center",
                transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
                willChange: "transform",
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                options={PDF_OPTIONS}
                loading={
                  <div
                    style={{
                      width: spreadWidth,
                      height: dimensions.height,
                    }}
                    className="flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 rounded-lg animate-pulse"
                  >
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                }
              >
                {numPages > 0 && (
                  <div className="relative w-full h-full">
                    {/* ── 3D Paper Stack Shadow underneath the book ── */}
                    <div
                      className="pointer-events-none absolute -inset-1 rounded-lg -z-10 transition-opacity duration-300"
                      style={{
                        filter: isDark
                          ? "drop-shadow(0 25px 50px rgba(0,0,0,0.85)) drop-shadow(0 8px 16px rgba(0,0,0,0.6))"
                          : "drop-shadow(0 25px 45px rgba(15,23,42,0.22)) drop-shadow(0 8px 16px rgba(15,23,42,0.12))",
                      }}
                    />

                    {/* ── Realistic Central 3D Book Spine Overlay (When Book is Open) ── */}
                    {isOpenSpread && (
                      <>
                        <div
                          className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 z-20 mix-blend-multiply opacity-50 dark:opacity-75"
                          style={{
                            background:
                              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.25) 49%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.25) 51%, rgba(0,0,0,0.06) 70%, transparent 100%)",
                          }}
                        />
                        <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] z-20 bg-black/25 dark:bg-black/60 shadow-[0_0_2px_rgba(0,0,0,0.4)]" />
                      </>
                    )}

                    {/* @ts-ignore */}
                    <HTMLFlipBook
                      width={dimensions.width}
                      height={dimensions.height}
                      size="fixed"
                      minWidth={dimensions.width}
                      maxWidth={dimensions.width}
                      minHeight={dimensions.height}
                      maxHeight={dimensions.height}
                      maxShadowOpacity={isDark ? 0.45 : 0.3}
                      showCover={true}
                      mobileScrollSupport={true}
                      onFlip={onFlip}
                      ref={flipBookRef}
                      usePortrait={false}
                      drawShadow={true}
                      flippingTime={650}
                      useMouseEvents={true}
                      swipeDistance={30}
                      showPageCorners={!isMobile}
                      startPage={0}
                      autoSize={false}
                      style={{ willChange: "transform" }}
                    >
                      {(() => {
                        const pages: React.ReactNode[] = [];

                        for (let i = 0; i < numPages; i++) {
                          const isFirst = i === 0;
                          const isLast = i === numPages - 1;
                          const isLeft = i > 0 && i % 2 === 1;
                          const isRight = i > 0 && i % 2 === 0;

                          pages.push(
                            <FlipPage
                              key={`p-${i}`}
                              number={i + 1}
                              isLeft={isLeft}
                              isRight={isRight}
                              isCover={isFirst}
                              isBackCover={isLast}
                            >
                              <Page
                                pageNumber={i + 1}
                                width={dimensions.width}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                loading={
                                  <div className="w-full h-full bg-neutral-100 animate-pulse flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-neutral-300 animate-spin" />
                                  </div>
                                }
                                className="w-full h-full"
                              />
                            </FlipPage>,
                          );
                        }

                        return pages;
                      })()}
                    </HTMLFlipBook>
                  </div>
                )}
              </Document>
            </div>
          )}

          {/* ── Mobile Floating Top Section Badge ── */}
          {isMobile && isDocLoaded && !docError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <button
                onClick={() => setTocOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 dark:bg-slate-900/90 backdrop-blur-md border border-white/15 text-white shadow-lg active:scale-95 transition-transform"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold max-w-[200px] truncate">
                  {currentSection.judul}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-bold tabular-nums">
                  Hal {mobilePage}
                </span>
              </button>
            </div>
          )}

          {/* ── Mobile Side Floating Navigation Buttons ── */}
          {isMobile && isDocLoaded && !docError && (
            <>
              <button
                onClick={goPrev}
                disabled={isAtFrontCover}
                aria-label="Halaman Sebelumnya"
                className={`absolute left-2.5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-md border border-white/20 shadow-2xl text-white transition-all duration-300 ${
                  isAtFrontCover
                    ? "opacity-0 -translate-x-4 pointer-events-none"
                    : "opacity-85 hover:opacity-100 translate-x-0 active:scale-90 bg-slate-900/70"
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={goNext}
                disabled={isAtEnd}
                aria-label="Halaman Selanjutnya"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full backdrop-blur-md border border-white/20 shadow-2xl text-white transition-all duration-300 ${
                  isAtEnd
                    ? "opacity-0 translate-x-4 pointer-events-none"
                    : "opacity-85 hover:opacity-100 translate-x-0 active:scale-90 bg-slate-900/70"
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* ── Proposal Completed Auto-Close Modal (When At Back Cover) ── */}
          <AnimatePresence>
            {isAtEnd && isDocLoaded && !docError && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute bottom-4 sm:bottom-6 z-40 max-w-sm sm:max-w-md w-[92%] sm:w-auto mx-auto px-4 py-3 rounded-2xl bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl text-center text-white"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                    Proposal Selesai Dibaca
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mb-2.5 leading-relaxed">
                  Terima kasih atas apresiasi dan dukungan terhadap program GENABLE.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={
                      GENBI_CONFIG.whatsappUrl ||
                      "https://wa.me/6288239352876?text=Halo%2C%20saya%20telah%20membaca%20proposal%20GENABLE%20dan%20tertarik%20untuk%20berkolaborasi."
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 transition-all cursor-pointer shadow-md active:scale-95"
                    title="Hubungi via WhatsApp (0882-3935-2876)"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill="currentColor"
                      className="shrink-0"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.888 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.835 11.835 0 005.711 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
                    </svg>
                    <span className="hidden sm:inline">WhatsApp (0882-3935-2876)</span>
                    <span className="sm:hidden">WhatsApp</span>
                  </a>
                  <a
                    href={pdfUrl}
                    download="Proposal-GENABLE.pdf"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </a>
                  <button
                    onClick={goFirst}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
                    title="Buka dari Awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka Awal</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile Drawer (Sheet) for Daftar Isi ── */}
      {hasToc && isMobile && (
        <Sheet open={tocOpen} onOpenChange={setTocOpen}>
          <SheetContent
            side="left"
            className="w-80 p-0 border-r-0"
            style={{ backgroundColor: isDark ? "#0f172a" : "#1e293b" }}
          >
            <SheetTitle className="sr-only">Daftar Isi Proposal</SheetTitle>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white/90 tracking-wide">
                  Daftar Isi Proposal
                </span>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {daftarIsi.map((item, idx) => {
                const startPage = item.halaman;
                const endPage = item.halamanAkhir || item.halaman;
                const isActive =
                  mobilePage >= startPage && mobilePage <= endPage;

                return (
                  <button
                    key={`${item.urutan}-${item.judul}`}
                    onClick={() => navigateToPage(item.halaman)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 font-medium"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-500/30 text-indigo-300"
                          : "bg-white/[0.05] text-white/40 group-hover:text-white/60"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate leading-tight">
                      {item.judul}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] tabular-nums transition-colors ${
                        isActive
                          ? "text-indigo-400 font-semibold"
                          : "text-white/30 group-hover:text-white/40"
                      }`}
                    >
                      {item.labelHalaman || `Hal ${item.halaman}`}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <p className="text-[11px] text-white/40 text-center">
                GENABLE · {numPages} Halaman Proposal
              </p>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Bottom Floating Modern Toolbar ── */}
      <div className="shrink-0 z-20 relative px-2 sm:px-4 pb-2 pt-1 flex justify-center">
        <div
          className={`inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl border backdrop-blur-xl ${toolbarBg}`}
        >
          {/* First page (Cover) */}
          <TBtn
            onClick={goFirst}
            disabled={isAtFrontCover}
            cls={isAtFrontCover ? btnDisabledCls : btnBase}
            tip="Halaman pertama (Cover)"
          >
            <ChevronsLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </TBtn>

          {/* Prev */}
          <TBtn
            onClick={goPrev}
            disabled={isAtFrontCover}
            cls={isAtFrontCover ? btnDisabledCls : btnBase}
            tip="Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
          </TBtn>

          {/* Next */}
          <TBtn
            onClick={goNext}
            disabled={isAtEnd}
            cls={isAtEnd ? btnDisabledCls : btnBase}
            tip={
              (isMobile ? mobilePage === numPages - 1 : currentPage === numPages - 3)
                ? "Tutup Proposal"
                : "Selanjutnya"
            }
          >
            <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
          </TBtn>

          {/* Last page (Tutup Proposal) */}
          <TBtn
            onClick={goLast}
            disabled={isAtEnd}
            cls={isAtEnd ? btnDisabledCls : btnBase}
            tip="Tutup proposal (Halaman terakhir)"
          >
            <ChevronsRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </TBtn>

          <Sep isDark={isDark} />

          {/* Page Counter Indicator */}
          {isMobile ? (
            <div className="flex items-center gap-1 px-2 text-xs font-semibold tabular-nums text-white/80">
              <span className="text-white font-bold">{mobilePage}</span>
              <span className="text-white/40">/</span>
              <span>{numPages}</span>
              {mobilePage === numPages && (
                <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  Tutup
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 text-xs sm:text-sm font-semibold tabular-nums text-white/80">
              {currentPage === 0 ? (
                <span className="text-white font-bold">Cover (Hal 1)</span>
              ) : currentPage >= numPages - 1 ? (
                <span className="text-emerald-300 font-bold">
                  Tutup Proposal (Hal {numPages})
                </span>
              ) : (
                <>
                  <span className="text-white font-bold">
                    Hal {currentPage + 1} - {currentPage + 2}
                  </span>
                  <span className="text-white/40">/</span>
                  <span>{numPages}</span>
                </>
              )}
            </div>
          )}

          <Sep isDark={isDark} />

          {/* Mobile Overview / Zoom Focus Toggle */}
          {isMobile && (
            <TBtn
              onClick={() => setMobileOverview(!mobileOverview)}
              cls={
                mobileOverview
                  ? "text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30"
                  : btnBase
              }
              tip={mobileOverview ? "Fokus 1 Halaman" : "Lihat 2 Halaman"}
            >
              {mobileOverview ? (
                <Book className="w-4 h-4" />
              ) : (
                <Columns className="w-4 h-4" />
              )}
            </TBtn>
          )}

          {/* Zoom controls */}
          <TBtn
            onClick={zoomIn}
            disabled={zoom >= 1.8}
            cls={zoom >= 1.8 ? btnDisabledCls : btnBase}
            tip="Perbesar tampilan"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </TBtn>
          <TBtn
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            cls={zoom <= 0.5 ? btnDisabledCls : btnBase}
            tip="Perkecil tampilan"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </TBtn>

          {/* Fullscreen (desktop only) */}
          <div className="hidden sm:flex items-center">
            <TBtn
              onClick={toggleFullscreen}
              cls={btnBase}
              tip="Layar penuh"
            >
              <Maximize className="w-5 h-5" />
            </TBtn>
          </div>

          <Sep isDark={isDark} />

          {/* Theme Toggle */}
          <ThemeToggle
            size="sm"
            className="border-0! bg-transparent! text-white/60 hover:text-white hover:bg-white/10!"
          />

          {/* Daftar Isi Trigger */}
          {hasToc && (
            <>
              <Sep isDark={isDark} />
              <TBtn
                onClick={() => setTocOpen(!tocOpen)}
                cls={
                  tocOpen
                    ? "text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30"
                    : btnBase
                }
                tip="Daftar Isi Proposal"
              >
                <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5" />
              </TBtn>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        .react-pdf__Page__annotations,
        .react-pdf__Page__textContent {
          display: none !important;
        }
        .flip-page .react-pdf__Page {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flip-page .react-pdf__Page canvas {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain;
          pointer-events: none;
        }
        div:fullscreen {
          background: inherit;
        }

        /* 3D Paper edge & stack simulation */
        .flip-page {
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
          background-color: #ffffff;
          user-select: none;
          -webkit-user-select: none;
        }

        /* Front Hard Cover */
        .flip-cover-front {
          border-radius: 0 6px 6px 0 !important;
          box-shadow:
            inset -1px 0 0 rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08),
            0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
        }

        /* Back Hard Cover */
        .flip-cover-back {
          border-radius: 6px 0 0 6px !important;
          box-shadow:
            inset 1px 0 0 rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(0, 0, 0, 0.08),
            0 10px 25px -5px rgba(0, 0, 0, 0.25) !important;
        }

        .dark .flip-page {
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}

/* ── Toolbar button helper ── */
function TBtn({
  onClick,
  disabled,
  cls,
  tip,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  cls: string;
  tip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tip}
      className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-150 disabled:cursor-not-allowed cursor-pointer ${cls}`}
    >
      {children}
    </button>
  );
}

function Sep({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`w-px h-5 mx-0.5 sm:mx-1 ${isDark ? "bg-white/10" : "bg-white/15"}`}
    />
  );
}
