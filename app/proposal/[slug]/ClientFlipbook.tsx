'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Loader2,
  Volume2,
  VolumeX,
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
} from 'lucide-react';
import { EProposal } from '@/features/api/eproposalApi';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '@/components/atoms/ThemeToggle';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ── Page wrappers ── */
const FlipPage = React.forwardRef<HTMLDivElement, { children: React.ReactNode; number?: number }>(
  ({ children, number }, ref) => (
    <div ref={ref} className="flip-page bg-white overflow-hidden relative" data-density="soft">
      <div className="h-full w-full">{children}</div>
      {number !== undefined && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-neutral-400 font-medium tracking-widest select-none">
          {number}
        </span>
      )}
    </div>
  ),
);
FlipPage.displayName = 'FlipPage';

const FlipCover = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <div ref={ref} className="flip-page bg-white overflow-hidden" data-density="hard">
      <div className="h-full w-full">{children}</div>
    </div>
  ),
);
FlipCover.displayName = 'FlipCover';

/* ── Main Component ── */
export default function ClientFlipbook({ proposal, onReady }: { proposal: EProposal; onReady?: () => void }) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDocLoaded, setIsDocLoaded] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 500, height: 707 });
  const [tocOpen, setTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panSide, setPanSide] = useState<'left'|'right'>('right');

  // Responsive check
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    // Auto-open TOC on desktop if it exists
    if (!mq.matches && proposal.daftar_isi?.length) {
      setTocOpen(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches && proposal.daftar_isi?.length) setTocOpen(true);
      else setTocOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [proposal.daftar_isi]);

  const flipBookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookAreaRef = useRef<HTMLDivElement>(null);

  const { pengaturan } = proposal;
  const soundEffect = pengaturan?.sound_effect ?? true;
  const bgMusic = pengaturan?.bg_music_url || '';
  const daftarIsi = proposal.daftar_isi?.slice().sort((a, b) => a.urutan - b.urutan) ?? [];
  const hasToc = daftarIsi.length > 0;

  // Only the front cover (page 0) triggers single-page centered mode.
  // The back cover should stay in spread mode so the user can navigate to it.
  const isOnCover = currentPage === 0;

  /* ── Sizing: 90% of viewport ── */
  const calculateDimensions = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ratio = 1 / 1.414; // A4

    const toolbarH = 48;
    const availH = vh - toolbarH;

    // Height: 90% of available
    let pageH = Math.floor(availH * 0.93);
    let pageW = Math.floor(pageH * ratio);

    const isMob = vw <= 768;
    const maxArea = Math.floor(vw * 0.95);

    if (isMob) {
      pageW = maxArea;
      pageH = Math.floor(pageW / ratio);
      if (pageH > availH * 0.9) {
        pageH = Math.floor(availH * 0.9);
        pageW = Math.floor(pageH * ratio);
      }
    } else {
      if (pageW * 2 > maxArea) {
        pageW = Math.floor(maxArea / 2);
        pageH = Math.floor(pageW / ratio);
      }
    }

    pageW = Math.max(pageW, 220);
    pageH = Math.max(pageH, 311);

    setDimensions({ width: pageW, height: pageH });
  }, []);

  useEffect(() => {
    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [calculateDimensions]);

  /* ── Music ── */
  useEffect(() => {
    if (bgMusic) {
      const a = new Audio(bgMusic);
      a.loop = true;
      a.volume = 0.3;
      audioRef.current = a;
    }
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, [bgMusic]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
    setIsPlaying(!isPlaying);
  };

  /* ── Flip sound ── */
  const onFlip = useCallback((e: any) => {
    const isForward = e.data > currentPage;
    setCurrentPage(e.data);
    
    if (e.data === 0) setPanSide('right');
    else if (isForward) setPanSide('left');
    else setPanSide('right');

    if (soundEffect) {
      const s = new Audio('/sound/effect/flip_effect.mp3');
      s.volume = 0.4;
      s.play().catch(() => {});
    }
  }, [soundEffect, currentPage]);

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); flipBookRef.current?.pageFlip()?.flipNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); flipBookRef.current?.pageFlip()?.flipPrev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Fullscreen ── */
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };
  useEffect(() => {
    const onFs = () => setTimeout(calculateDimensions, 100);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [calculateDimensions]);

  /* ── Auto-flip ── */
  useEffect(() => {
    if (!pengaturan?.auto_flip || !isDocLoaded) return;
    const iv = setInterval(() => {
      const pf = flipBookRef.current?.pageFlip();
      if (pf && pf.getCurrentPageIndex() < pf.getPageCount() - 1) pf.flipNext();
    }, 5000);
    return () => clearInterval(iv);
  }, [pengaturan?.auto_flip, isDocLoaded]);

  /* ── Zoom ── */
  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 1.8));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setIsDocLoaded(true);
    // Signal to parent that PDF is ready
    onReady?.();
  };

  // Internal page count includes potential filler page
  const needsBlank = numPages % 2 === 0;
  const totalInternalPages = needsBlank ? numPages + 1 : numPages;

  const goFirst = () => { flipBookRef.current?.pageFlip()?.flip(0); setPanSide('right'); };
  const goLast = () => { flipBookRef.current?.pageFlip()?.flip(totalInternalPages - 1); setPanSide('left'); };

  const goPrev = () => {
    if (isMobile && currentPage > 0 && panSide === 'right') setPanSide('left');
    else flipBookRef.current?.pageFlip()?.flipPrev();
  };

  const goNext = () => {
    // If not on the first page and currently viewing the left side, pan right.
    if (isMobile && currentPage > 0 && panSide === 'left') setPanSide('right');
    else flipBookRef.current?.pageFlip()?.flipNext();
  };

  const isAtEnd = isMobile 
    ? (currentPage >= totalInternalPages - 2 && panSide === 'right')
    : currentPage >= totalInternalPages - 1;

  const bgColor = isDark ? '#1e2a3a' : '#c7cdd4';
  const toolbarBg = isDark
    ? 'bg-[#141c28]/95 border-white/[0.06]'
    : 'bg-[#3a4a5c]/90 border-[#3a4a5c]';
  const btnBase = 'text-white/60 hover:text-white hover:bg-white/10';
  const btnDisabledCls = 'text-white/20';

  // Spread width = 2 pages, single cover = 1 page
  const spreadWidth = dimensions.width * 2;
  const visibleWidth = isOnCover ? dimensions.width : spreadWidth;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full relative select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
    >
      {/* Main area: sidebar + book */}
      <div className="flex-1 flex min-h-0 relative">

        {/* ── Desktop Sidebar (md+) ── */}
        {hasToc && !isMobile && (
          <div
            className="shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out"
            style={{ width: tocOpen ? 280 : 0 }}
          >
            <div className="w-[280px] h-full flex flex-col border-r border-white/[0.08]" style={{ backgroundColor: isDark ? '#111827' : '#1f2937' }}>
              {/* Sidebar header */}
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white/90 tracking-wide">Daftar Isi</span>
                </div>
                <button
                  onClick={() => setTocOpen(false)}
                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar entries */}
              <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
                {daftarIsi.map((item, idx) => {
                  const isActive = currentPage === item.halaman - 1 || currentPage === item.halaman;
                  return (
                    <button
                      key={`${item.urutan}-${item.judul}`}
                      onClick={() => flipBookRef.current?.pageFlip()?.flip(item.halaman - 1)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-white/[0.05] text-white/30 group-hover:text-white/50'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 truncate leading-tight">{item.judul}</span>
                      <span className={`shrink-0 text-[11px] tabular-nums transition-colors ${
                        isActive ? 'text-indigo-400/60' : 'text-white/20 group-hover:text-white/30'
                      }`}>
                        {item.halaman}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar footer */}
              <div className="shrink-0 px-4 py-2.5 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/25 text-center">{daftarIsi.length} bagian · {numPages} halaman</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Book area ── */}
        <div
          ref={bookAreaRef}
          className="flex-1 relative min-h-0"
          style={{ overflow: 'visible' }}
        >
        {/* 
          Centered book container.
          We manually position the flipbook in the absolute center of this area.
          The stf__parent/stf__wrapper are absolutely positioned by the library,
          so we need to counter that with our own absolute positioning.
        */}
        <div
          style={{
            position: 'absolute',
            /*
              The flipbook wrapper is always spreadWidth (2 * pageWidth) wide.
              Cover page sits at x=pageWidth INSIDE the wrapper (right half).
              
              Spread mode: center the full wrapper
                left = 50% - spreadWidth*zoom/2
              
              Cover mode: center just the cover page
                The cover is at x=pageWidth inside wrapper, so its center = left + pageWidth + pageWidth/2
                To center: left + pageWidth + pageWidth/2 = 50%
                => left = 50% - pageWidth - pageWidth/2 = 50% - 1.5*pageWidth
            */
            left: isMobile
              ? panSide === 'left'
                ? `calc(50% - ${(spreadWidth * zoom) / 4}px)`
                : `calc(50% - ${(spreadWidth * zoom) * 0.75}px)`
              : isOnCover
                ? `calc(50% - ${(dimensions.width * 1.5 * zoom)}px)`
                : `calc(50% - ${(spreadWidth * zoom) / 2}px)`,
            // Center vertically
            top: `calc(50% - ${(dimensions.height * zoom) / 2}px)`,
            width: spreadWidth,
            height: dimensions.height,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'left 0.7s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s ease',
          }}
        >
          <Document
            file={proposal.file_pdf_url}
            onLoadSuccess={onDocumentLoadSuccess}
            options={PDF_OPTIONS}
            loading={<div style={{ width: spreadWidth, height: dimensions.height }} />}
            error={<div style={{ width: spreadWidth, height: dimensions.height }} />}
          >
            {numPages > 0 && (
              <div
                className="relative"
                style={{
                  filter: isDark
                    ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
                    : 'drop-shadow(0 20px 40px rgba(0,0,0,0.25)) drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                }}
              >
                {/* Simulated 3D Spine Fold Overlay */}
                <div 
                  className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 z-10 mix-blend-multiply opacity-60 dark:opacity-80"
                  style={{
                    background: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.3) 48%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0.08) 65%, transparent 100%)',
                  }}
                />
                <div 
                  className="pointer-events-none absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] z-10 bg-black/10 dark:bg-black/40"
                />

                {/* @ts-ignore */}
                <HTMLFlipBook
                  width={dimensions.width}
                  height={dimensions.height}
                  size="fixed"
                  minWidth={dimensions.width}
                  maxWidth={dimensions.width}
                  minHeight={dimensions.height}
                  maxHeight={dimensions.height}
                  maxShadowOpacity={isDark ? 0.6 : 0.3}
                  showCover={true}
                  mobileScrollSupport={true}
                  onFlip={onFlip}
                  ref={flipBookRef}
                  usePortrait={false}
                  drawShadow={true}
                  flippingTime={600}
                  useMouseEvents={true}
                  swipeDistance={30}
                  showPageCorners={true}
                  startPage={0}
                  autoSize={false}
                  style={{ willChange: 'transform' }}
                >
                  {(() => {
                    // react-pageflip with showCover=true + usePortrait=false needs
                    // even total children for proper spread pairing.
                    // needsBlank is computed at component level above.
                    const pages: React.ReactNode[] = [];

                    for (let i = 0; i < numPages; i++) {
                      const isFirst = i === 0;
                      const isLast = i === numPages - 1;
                      const isCoverPage = isFirst || isLast;
                      const Wrapper = isCoverPage ? FlipCover : FlipPage;

                      // If this is the last page AND we need a blank, insert blank before it
                      if (isLast && needsBlank) {
                        pages.push(
                          <FlipPage key="blank-filler">
                            <div className="w-full h-full bg-white" />
                          </FlipPage>
                        );
                      }

                      pages.push(
                        <Wrapper key={`p-${i}`} number={isCoverPage ? undefined : i + 1}>
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
                        </Wrapper>
                      );
                    }

                    return pages;
                  })()}
                </HTMLFlipBook>
              </div>
            )}
          </Document>
        </div>{/* close positioning div */}
        </div>{/* close bookAreaRef */}
      </div>{/* close flex wrapper */}

      {/* ── Mobile Drawer (Sheet) ── */}
      {hasToc && isMobile && (
        <Sheet open={tocOpen} onOpenChange={setTocOpen}>
          <SheetContent side="left" className="w-80 p-0 border-r-0" style={{ backgroundColor: isDark ? '#111827' : '#1f2937' }}>
            <SheetTitle className="sr-only">Daftar Isi</SheetTitle>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white/90 tracking-wide">Daftar Isi</span>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer entries */}
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {daftarIsi.map((item, idx) => {
                const isActive = currentPage === item.halaman - 1 || currentPage === item.halaman;
                return (
                  <button
                    key={`${item.urutan}-${item.judul}`}
                    onClick={() => {
                      flipBookRef.current?.pageFlip()?.flip(item.halaman - 1);
                      setTocOpen(false);
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-white/[0.05] text-white/30 group-hover:text-white/50'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate leading-tight">{item.judul}</span>
                    <span className={`shrink-0 text-[11px] tabular-nums transition-colors ${
                      isActive ? 'text-indigo-400/60' : 'text-white/20 group-hover:text-white/30'
                    }`}>
                      {item.halaman}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <p className="text-[11px] text-white/25 text-center">{daftarIsi.length} bagian · {numPages} halaman</p>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Bottom Toolbar ── */}
      <div className="shrink-0 z-10 relative">
        <div className={`flex items-center justify-center gap-0.5 px-4 py-2 border-t transition-colors duration-500 ${toolbarBg}`}>
          <TBtn onClick={goFirst} disabled={currentPage <= 0} cls={currentPage <= 0 ? btnDisabledCls : btnBase} tip="Halaman pertama">
            <ChevronsLeft className="w-5 h-5" />
          </TBtn>
          <TBtn onClick={goPrev} disabled={currentPage <= 0} cls={currentPage <= 0 ? btnDisabledCls : btnBase} tip="Sebelumnya">
            <ChevronLeft className="w-5 h-5" />
          </TBtn>
          <TBtn onClick={goNext} disabled={isAtEnd} cls={isAtEnd ? btnDisabledCls : btnBase} tip="Selanjutnya">
            <ChevronRight className="w-5 h-5" />
          </TBtn>
          <TBtn onClick={goLast} disabled={isAtEnd} cls={isAtEnd ? btnDisabledCls : btnBase} tip="Halaman terakhir">
            <ChevronsRight className="w-5 h-5" />
          </TBtn>

          <Sep isDark={isDark} />

          <div className="flex items-center gap-1.5 px-3 text-sm font-semibold tabular-nums text-white/70">
            <span className="text-white">{Math.min(currentPage + 1, numPages)}</span>
            <span className="text-white/30">/</span>
            <span>{numPages}</span>
          </div>

          <Sep isDark={isDark} />

          <TBtn onClick={zoomIn} disabled={zoom >= 1.8} cls={zoom >= 1.8 ? btnDisabledCls : btnBase} tip="Perbesar">
            <ZoomIn className="w-5 h-5" />
          </TBtn>
          <TBtn onClick={zoomOut} disabled={zoom <= 0.5} cls={zoom <= 0.5 ? btnDisabledCls : btnBase} tip="Perkecil">
            <ZoomOut className="w-5 h-5" />
          </TBtn>
          <TBtn onClick={toggleFullscreen} cls={btnBase} tip="Layar penuh">
            <Maximize className="w-5 h-5" />
          </TBtn>

          <Sep isDark={isDark} />

          <ThemeToggle size="sm" className="border-0! bg-transparent! text-white/60 hover:text-white hover:bg-white/10!" />

          {hasToc && (
            <>
              <Sep isDark={isDark} />
              <TBtn
                onClick={() => setTocOpen(!tocOpen)}
                cls={tocOpen ? 'text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20' : btnBase}
                tip="Daftar Isi"
              >
                <ListOrdered className="w-5 h-5" />
              </TBtn>
            </>
          )}

          {bgMusic && (
            <TBtn
              onClick={toggleMusic}
              cls={isPlaying ? 'text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20' : btnBase}
              tip={isPlaying ? 'Matikan musik' : 'Putar musik'}
            >
              {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </TBtn>
          )}
        </div>
      </div>

      <style jsx global>{`
        .react-pdf__Page__annotations,
        .react-pdf__Page__textContent { display: none !important; }
        .flip-page .react-pdf__Page { display: flex; align-items: center; justify-content: center; }
        .flip-page .react-pdf__Page canvas { max-width: 100% !important; max-height: 100% !important; object-fit: contain; }
        div:fullscreen { background: inherit; }
        
        /* 3D Paper edge simulation */
        .flip-page {
          border-radius: 4px;
          border-right: 1px solid rgba(0,0,0,0.08);
          border-left: 1px solid rgba(0,0,0,0.08);
          background-image: linear-gradient(to right, rgba(255,255,255,0) 95%, rgba(0,0,0,0.03) 100%);
        }
        
        /* Hard cover enhanced lighting */
        .flip-page[data-density="hard"] {
          border-radius: 6px;
          border: 2px solid rgba(0,0,0,0.1);
          background-image: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0.05) 100%);
        }

        .dark .flip-page[data-density="hard"] {
          border-color: rgba(255,255,255,0.05);
        }
        .dark .flip-page {
          border-color: rgba(255,255,255,0.03);
          background-image: linear-gradient(to right, rgba(255,255,255,0) 95%, rgba(0,0,0,0.15) 100%);
        }
      `}</style>
    </div>
  );
}

/* ── Toolbar helpers ── */
function TBtn({ onClick, disabled, cls, tip, children }: {
  onClick: () => void; disabled?: boolean; cls: string; tip: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={tip}
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 disabled:cursor-not-allowed ${cls}`}
    >{children}</button>
  );
}

function Sep({ isDark }: { isDark: boolean }) {
  return <div className={`w-px h-6 mx-1.5 ${isDark ? 'bg-white/10' : 'bg-white/20'}`} />;
}
