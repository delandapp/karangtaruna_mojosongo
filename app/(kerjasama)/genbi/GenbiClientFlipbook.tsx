"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import Image from "next/image";
import Link from "next/link";
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
} from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GENBI_CONFIG } from "./constants";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ── Page wrappers ── */
const FlipPage = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; number?: number }
>(({ children, number }, ref) => (
  <div
    ref={ref}
    className="flip-page bg-white overflow-hidden relative"
    data-density="soft"
  >
    <div className="h-full w-full">{children}</div>
    {number !== undefined && (
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 font-medium tracking-widest select-none">
        {number}
      </span>
    )}
  </div>
));
FlipPage.displayName = "FlipPage";

const FlipCover = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children }, ref) => (
  <div
    ref={ref}
    className="flip-page bg-white overflow-hidden"
    data-density="hard"
  >
    <div className="h-full w-full">{children}</div>
  </div>
));
FlipCover.displayName = "FlipCover";

/* ── Main Component ── */
export default function GenbiClientFlipbook({
  pdfUrl = GENBI_CONFIG.pdfUrl,
  onReady,
}: {
  pdfUrl?: string;
  onReady?: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
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

  const daftarIsi = GENBI_CONFIG.daftarIsi;
  const hasToc = daftarIsi.length > 0;

  // Responsive check
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

  const isOnCover = currentPage === 0;

  /* ── Sizing: Responsive single-page (mobile) & spread (desktop) ── */
  const calculateDimensions = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMob = vw <= 768;
    setIsMobile(isMob);

    // Exact A4 aspect ratio from PDF MediaBox (595.5 / 842.25)
    const ratio = 595.5 / 842.25;

    // Header & toolbar reservation with safe vertical padding
    const topBarH = isMob ? 50 : 56;
    const toolbarH = isMob ? 46 : 48;
    const paddingV = isMob ? 16 : 28;
    const availH = Math.max(vh - toolbarH - topBarH - paddingV, 200);

    if (isMob) {
      // Mobile: Single page portrait mode
      const maxW = Math.min(vw - 24, 480);
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
      // Desktop: Two-page landscape spread
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

  /* ── Flip sound effect ── */
  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);

    try {
      const s = new Audio("/sound/effect/flip_effect.mp3");
      s.volume = 0.4;
      s.play().catch(() => {});
    } catch {}
  }, []);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        flipBookRef.current?.pageFlip()?.flipNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        flipBookRef.current?.pageFlip()?.flipPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Fullscreen ── */
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

  /* ── Zoom ── */
  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));

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

  const needsBlank = numPages % 2 === 0;
  const totalInternalPages = needsBlank ? numPages + 1 : numPages;

  const goFirst = () => {
    flipBookRef.current?.pageFlip()?.flip(0);
  };
  const goLast = () => {
    const target = isMobile ? numPages - 1 : totalInternalPages - 1;
    flipBookRef.current?.pageFlip()?.flip(target);
  };

  const goPrev = () => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  };

  const goNext = () => {
    flipBookRef.current?.pageFlip()?.flipNext();
  };

  const isAtEnd = isMobile
    ? currentPage >= numPages - 1
    : currentPage >= totalInternalPages - 1;

  const bgColor = isDark ? "#121824" : "#e5e9f0";
  const headerBg = isDark
    ? "bg-[#0f172a]/90 border-b border-white/[0.08]"
    : "bg-white/90 border-b border-slate-200";
  const toolbarBg = isDark
    ? "bg-[#0f172a]/95 border-white/[0.08]"
    : "bg-[#2d3748]/95 border-[#2d3748]";
  const btnBase = "text-white/70 hover:text-white hover:bg-white/10";
  const btnDisabledCls = "text-white/20";

  const spreadWidth = dimensions.width * 2;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full relative select-none transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Top Bar: Logo Partner Konstan + Identitas Kegiatan ── */}
      <header
        className={`shrink-0 z-30 flex items-center justify-between px-2 sm:px-6 py-2 backdrop-blur-md transition-colors duration-300 ${headerBg}`}
      >
        {/* Left: Home link + 4 Logos */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors shrink-0"
            title="Kembali ke Beranda"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          <div className="h-4 w-px bg-slate-300 dark:bg-white/10 hidden sm:block" />

          {/* 4 Logos Container */}
          <div className="flex items-center gap-1 sm:gap-2.5 p-1 rounded-2xl bg-white/80 dark:bg-white/90 shadow-sm border border-slate-200/80 dark:border-white/20">
            {GENBI_CONFIG.logos.map((logo) => {
              const isBI = logo.isFullRounded === false;
              return (
                <div
                  key={logo.name}
                  className={`relative flex items-center justify-center shrink-0 ${
                    isBI
                      ? "px-1 sm:px-1.5 py-0.5 rounded-md"
                      : "w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white shadow-xs p-0.5 aspect-square"
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
                        ? "h-5 sm:h-7 w-auto max-w-[42px] sm:max-w-[65px]"
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
                    Daftar Isi
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
                      onClick={() =>
                        flipBookRef.current?.pageFlip()?.flip(item.halaman - 1)
                      }
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-indigo-500/20 text-indigo-300"
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
                            ? "text-indigo-400/80"
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
                <p className="text-[11px] text-white/30 text-center">
                  GENABLE · {numPages || daftarIsi.length} Halaman
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Book Area */}
        <div
          ref={bookAreaRef}
          className="flex-1 relative min-h-0 flex items-center justify-center"
          style={{ overflow: "visible" }}
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
                left: isMobile
                  ? `calc(50% - ${(dimensions.width * zoom) / 2}px)`
                  : isOnCover
                    ? `calc(50% - ${dimensions.width * 1.5 * zoom}px)`
                    : `calc(50% - ${(spreadWidth * zoom) / 2}px)`,
                top: `calc(50% - ${(dimensions.height * zoom) / 2}px)`,
                width: isMobile ? dimensions.width : spreadWidth,
                height: dimensions.height,
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition:
                  "left 0.4s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s ease",
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
                      width: isMobile ? dimensions.width : spreadWidth,
                      height: dimensions.height,
                    }}
                    className="flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 rounded-lg animate-pulse"
                  >
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                }
              >
                {numPages > 0 && (
                  <div
                    className="relative"
                    style={{
                      filter: isDark
                        ? "drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))"
                        : "drop-shadow(0 20px 40px rgba(0,0,0,0.25)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
                    }}
                  >
                    {/* Simulated 3D Spine Fold Overlay — Desktop spread only */}
                    {!isMobile && (
                      <>
                        <div
                          className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 z-10 mix-blend-multiply opacity-60 dark:opacity-80"
                          style={{
                            background:
                              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.3) 48%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0.08) 65%, transparent 100%)",
                          }}
                        />
                        <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] z-10 bg-black/10 dark:bg-black/40" />
                      </>
                    )}

                    {/* @ts-ignore */}
                    <HTMLFlipBook
                      key={isMobile ? "mobile-portrait" : "desktop-landscape"}
                      width={dimensions.width}
                      height={dimensions.height}
                      size="fixed"
                      minWidth={dimensions.width}
                      maxWidth={dimensions.width}
                      minHeight={dimensions.height}
                      maxHeight={dimensions.height}
                      maxShadowOpacity={isDark ? 0.6 : 0.3}
                      showCover={!isMobile}
                      mobileScrollSupport={true}
                      onFlip={onFlip}
                      ref={flipBookRef}
                      usePortrait={isMobile}
                      drawShadow={true}
                      flippingTime={isMobile ? 450 : 600}
                      useMouseEvents={true}
                      swipeDistance={25}
                      showPageCorners={!isMobile}
                      startPage={currentPage}
                      autoSize={false}
                      style={{ willChange: "transform" }}
                    >
                      {(() => {
                        const pages: React.ReactNode[] = [];

                        for (let i = 0; i < numPages; i++) {
                          const isFirst = i === 0;
                          const isLast = i === numPages - 1;
                          const isCoverPage = isFirst || isLast;
                          const Wrapper = isCoverPage ? FlipCover : FlipPage;

                          if (isLast && needsBlank && !isMobile) {
                            pages.push(
                              <FlipPage key="blank-filler">
                                <div className="w-full h-full bg-white" />
                              </FlipPage>,
                            );
                          }

                          pages.push(
                            <Wrapper
                              key={`p-${i}`}
                              number={isCoverPage ? undefined : i + 1}
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
                            </Wrapper>,
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
        </div>
      </div>

      {/* ── Mobile Drawer (Sheet) ── */}
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
                  Daftar Isi
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
                const leftPage = currentPage === 0 ? 1 : currentPage + 1;
                const rightPage = currentPage === 0 ? 1 : currentPage + 2;
                const isActive =
                  (leftPage >= startPage && leftPage <= endPage) ||
                  (rightPage >= startPage && rightPage <= endPage);

                return (
                  <button
                    key={`${item.urutan}-${item.judul}`}
                    onClick={() => {
                      flipBookRef.current?.pageFlip()?.flip(item.halaman - 1);
                      setTocOpen(false);
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300"
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
                          ? "text-indigo-400/80"
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
              <p className="text-[11px] text-white/30 text-center">
                GENABLE · {numPages || daftarIsi.length} Halaman
              </p>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Mobile Navigation Floating Buttons ── */}
      {isMobile && isDocLoaded && !docError && (
        <>
          <button
            onClick={goPrev}
            disabled={currentPage <= 0}
            aria-label="Halaman Sebelumnya"
            style={{ pointerEvents: currentPage <= 0 ? "none" : "auto" }}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border border-white/20 shadow-xl text-white transition-all duration-300 ${
              currentPage <= 0
                ? "opacity-0 -translate-x-3 pointer-events-none"
                : "opacity-80 hover:opacity-100 translate-x-0 active:scale-95 bg-black/50"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goNext}
            disabled={isAtEnd}
            aria-label="Halaman Selanjutnya"
            style={{ pointerEvents: isAtEnd ? "none" : "auto" }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md border border-white/20 shadow-xl text-white transition-all duration-300 ${
              isAtEnd
                ? "opacity-0 translate-x-3 pointer-events-none"
                : "opacity-80 hover:opacity-100 translate-x-0 active:scale-95 bg-black/50"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ── Bottom Toolbar ── */}
      <div className="shrink-0 z-20 relative">
        <div
          className={`flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1.5 sm:py-2 border-t transition-colors duration-500 overflow-x-auto ${toolbarBg}`}
        >
          {/* First page (desktop only) */}
          <div className="hidden sm:flex items-center">
            <TBtn
              onClick={goFirst}
              disabled={currentPage <= 0}
              cls={currentPage <= 0 ? btnDisabledCls : btnBase}
              tip="Halaman pertama"
            >
              <ChevronsLeft className="w-5 h-5" />
            </TBtn>
          </div>

          <TBtn
            onClick={goPrev}
            disabled={currentPage <= 0}
            cls={currentPage <= 0 ? btnDisabledCls : btnBase}
            tip="Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </TBtn>
          <TBtn
            onClick={goNext}
            disabled={isAtEnd}
            cls={isAtEnd ? btnDisabledCls : btnBase}
            tip="Selanjutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </TBtn>

          {/* Last page (desktop only) */}
          <div className="hidden sm:flex items-center">
            <TBtn
              onClick={goLast}
              disabled={isAtEnd}
              cls={isAtEnd ? btnDisabledCls : btnBase}
              tip="Halaman terakhir"
            >
              <ChevronsRight className="w-5 h-5" />
            </TBtn>
          </div>

          <Sep isDark={isDark} />

          <div className="flex items-center gap-1 px-2 sm:px-3 text-xs sm:text-sm font-semibold tabular-nums text-white/70">
            <span className="text-white">
              {Math.min(currentPage + 1, numPages || 1)}
            </span>
            <span className="text-white/30">/</span>
            <span>{numPages || 1}</span>
          </div>

          <Sep isDark={isDark} />

          <TBtn
            onClick={zoomIn}
            disabled={zoom >= 1.8}
            cls={zoom >= 1.8 ? btnDisabledCls : btnBase}
            tip="Perbesar"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </TBtn>
          <TBtn
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            cls={zoom <= 0.5 ? btnDisabledCls : btnBase}
            tip="Perkecil"
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

          <ThemeToggle
            size="sm"
            className="border-0! bg-transparent! text-white/60 hover:text-white hover:bg-white/10!"
          />

          {hasToc && (
            <>
              <Sep isDark={isDark} />
              <TBtn
                onClick={() => setTocOpen(!tocOpen)}
                cls={
                  tocOpen
                    ? "text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20"
                    : btnBase
                }
                tip="Daftar Isi"
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
        }
        div:fullscreen {
          background: inherit;
        }

        /* 3D Paper edge simulation */
        .flip-page {
          border-radius: 4px;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          background-image: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 95%,
            rgba(0, 0, 0, 0.03) 100%
          );
        }

        /* Hard cover enhanced lighting */
        .flip-page[data-density="hard"] {
          border-radius: 6px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          background-image: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(0, 0, 0, 0) 20%,
            rgba(0, 0, 0, 0.05) 100%
          );
        }

        .dark .flip-page[data-density="hard"] {
          border-color: rgba(255, 255, 255, 0.05);
        }
        .dark .flip-page {
          border-color: rgba(255, 255, 255, 0.03);
          background-image: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 95%,
            rgba(0, 0, 0, 0.15) 100%
          );
        }
      `}</style>
    </div>
  );
}

/* ── Toolbar helpers ── */
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
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  );
}

function Sep({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`w-px h-6 mx-1.5 ${isDark ? "bg-white/10" : "bg-white/20"}`}
    />
  );
}
