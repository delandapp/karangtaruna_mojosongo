"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProposalDocument } from "@/components/organisms/pdf/ProposalPDF";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Download,
  FileText,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  Palette,
  ImagePlus,
  Minus,
  Plus,
  List,
  ListOrdered,
  ArrowRight,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import type {
  ProposalData,
  ProposalSectionId,
  TextAlign,
  ProposalStyling,
} from "@/lib/types/proposal-template.types";
import {
  AVAILABLE_FONTS,
  PRESET_COLORS,
} from "@/lib/types/proposal-template.types";
import {
  PROPOSAL_TEMPLATES,
  PROPOSAL_SECTIONS,
} from "@/lib/constants/proposal-templates";
import { cn } from "@/lib/utils";

// ── Editor sub-components ──
import { SectionNav } from "@/components/organisms/proposal-editor/SectionNav";
import { ProposalPreview } from "@/components/organisms/proposal-editor/ProposalPreview";
import { SectionLatarBelakang } from "@/components/organisms/proposal-editor/SectionLatarBelakang";
import { SectionTujuanManfaat } from "@/components/organisms/proposal-editor/SectionTujuanManfaat";
import { SectionDeskripsiAcara } from "@/components/organisms/proposal-editor/SectionDeskripsiAcara";
import { SectionProfilPeserta } from "@/components/organisms/proposal-editor/SectionProfilPeserta";
import { SectionAnggaranDana } from "@/components/organisms/proposal-editor/SectionAnggaranDana";
import { SectionStrukturPanitia } from "@/components/organisms/proposal-editor/SectionStrukturPanitia";
import { SectionPaketSponsorship } from "@/components/organisms/proposal-editor/SectionPaketSponsorship";
import { SectionPenutupKontak } from "@/components/organisms/proposal-editor/SectionPenutupKontak";
import { SectionDataPendukung } from "@/components/organisms/proposal-editor/SectionDataPendukung";

// =============================================================================
// PROPS
// =============================================================================

interface ProposalEditorAppProps {
  eventId: number;
  templateId?: string;
  onBack: () => void;
}

export function ProposalEditorApp({ eventId, templateId, onBack }: ProposalEditorAppProps) {
  // ── Initialize data from template ──
  const template = useMemo(
    () => PROPOSAL_TEMPLATES.find((t) => t.id === templateId) || PROPOSAL_TEMPLATES[0],
    [templateId]
  );

  const [data, setData] = useState<ProposalData>(() => structuredClone(template.defaultData));
  const [activeSection, setActiveSection] = useState<ProposalSectionId>("latar_belakang");
  const [isGenerating, setIsGenerating] = useState(false);
  const [docPadding, setDocPadding] = useState(64); // px

  // Floating toolbar states
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showHeadingColor, setShowHeadingColor] = useState(false);
  const [showBodyColor, setShowBodyColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const activeSectionIndex = useMemo(
    () => PROPOSAL_SECTIONS.findIndex((s) => s.id === activeSection),
    [activeSection]
  );

  const s = data.styling;

  // ── Styling helpers ──
  const updateStyling = useCallback((patch: Partial<ProposalStyling>) => {
    setData((prev) => ({ ...prev, styling: { ...prev.styling, ...patch } }));
  }, []);

  const updateHeading = useCallback((patch: Partial<typeof s.headingStyle>) => {
    setData((prev) => ({
      ...prev,
      styling: { ...prev.styling, headingStyle: { ...prev.styling.headingStyle, ...patch } },
    }));
  }, []);

  const updateBody = useCallback((patch: Partial<typeof s.bodyStyle>) => {
    setData((prev) => ({
      ...prev,
      styling: { ...prev.styling, bodyStyle: { ...prev.styling.bodyStyle, ...patch } },
    }));
  }, []);

  const updatePageBg = useCallback((color: string) => {
    setData((prev) => {
      const newPageStyles = [...prev.styling.pageStyles];
      newPageStyles[activeSectionIndex] = { ...newPageStyles[activeSectionIndex], backgroundColor: color };
      return { ...prev, styling: { ...prev.styling, pageStyles: newPageStyles } };
    });
  }, [activeSectionIndex]);

  const closeAllDropdowns = () => {
    setShowFontDropdown(false);
    setShowHeadingColor(false);
    setShowBodyColor(false);
    setShowBgColor(false);
    setShowSettings(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Maks 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setData((prev) => ({ ...prev, logoUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── PDF generation ──
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Mempersiapkan PDF...", { id: "pdf-gen" });
      const blob = await pdf(<ProposalDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Proposal_Sponsorship_Event_${eventId}_${template.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Proposal berhasil di-generate!", { id: "pdf-gen" });
    } catch (err) {
      toast.error("Gagal men-generate PDF", { id: "pdf-gen" });
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Section editor ──
  const renderSectionEditor = () => {
    const props = { data, onChange: setData };
    switch (activeSection) {
      case "latar_belakang": return <SectionLatarBelakang {...props} />;
      case "tujuan_manfaat": return <SectionTujuanManfaat {...props} />;
      case "deskripsi_acara": return <SectionDeskripsiAcara {...props} />;
      case "profil_peserta": return <SectionProfilPeserta {...props} />;
      case "data_pendukung": return <SectionDataPendukung {...props} />;
      case "anggaran_dana": return <SectionAnggaranDana {...props} />;
      case "struktur_panitia": return <SectionStrukturPanitia {...props} />;
      case "paket_sponsorship": return <SectionPaketSponsorship {...props} />;
      case "penutup_kontak": return <SectionPenutupKontak {...props} />;
      default: return null;
    }
  };

  const currentPageBg = s.pageStyles[activeSectionIndex]?.backgroundColor || "#ffffff";

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* ══════════════════════════════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{template.nama}</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Event #{eventId}
            </span>
          </div>
        </div>
        <Button onClick={handleGeneratePDF} disabled={isGenerating} size="sm" className="gap-2 shadow-sm shadow-primary/20">
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isGenerating ? "Generating..." : "Export PDF"}
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3-PANEL LAYOUT
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-[220px_1fr_320px] min-h-0">
        {/* ── LEFT: Section Navigation ── */}
        <div className="border-r overflow-y-auto bg-background">
          <SectionNav activeSection={activeSection} onSectionChange={setActiveSection} data={data} />
        </div>

        {/* ── CENTER: Preview Canvas ── */}
        <div className="relative overflow-y-auto overflow-x-hidden bg-[#e5e7eb] dark:bg-[#1c1c1e]">
          <ProposalPreview data={data} activeSection={activeSection} docPadding={docPadding} />

          {/* ═════════════════════════════════════════════════════════════════
              FLOATING TOOLBAR (Figma-style)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="sticky bottom-4 mx-auto w-fit z-30">
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-popover/95 backdrop-blur-xl border rounded-xl shadow-2xl shadow-black/20">
              {/* Font Family */}
              <div className="relative">
                <button
                  onClick={() => { closeAllDropdowns(); setShowFontDropdown(!showFontDropdown); }}
                  className="flex items-center gap-1 h-8 px-2.5 rounded-lg hover:bg-muted/80 transition-colors text-xs"
                >
                  <Type className="w-3.5 h-3.5 shrink-0" />
                  <span className="max-w-[70px] truncate font-medium">{s.bodyStyle.fontFamily}</span>
                  <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                </button>
                {showFontDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 bg-popover border rounded-xl shadow-2xl py-1 w-52 max-h-60 overflow-y-auto">
                    {AVAILABLE_FONTS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => { updateBody({ fontFamily: f.value }); updateHeading({ fontFamily: f.value }); setShowFontDropdown(false); }}
                        className={cn("w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors", s.bodyStyle.fontFamily === f.value && "bg-primary/10 text-primary font-medium")}
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                        <span className="text-[10px] text-muted-foreground ml-1.5">{f.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* Font Size */}
              <div className="flex items-center gap-0.5">
                <button onClick={() => updateBody({ fontSize: Math.max(8, s.bodyStyle.fontSize - 1) })} className="h-8 w-7 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-mono w-6 text-center">{s.bodyStyle.fontSize}</span>
                <button onClick={() => updateBody({ fontSize: Math.min(24, s.bodyStyle.fontSize + 1) })} className="h-8 w-7 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* Bold / Italic */}
              <button
                onClick={() => updateBody({ fontWeight: s.bodyStyle.fontWeight === "bold" ? "normal" : "bold" })}
                className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors", s.bodyStyle.fontWeight === "bold" ? "bg-primary/15 text-primary" : "hover:bg-muted/80")}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateBody({ fontStyle: s.bodyStyle.fontStyle === "italic" ? "normal" : "italic" })}
                className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors", s.bodyStyle.fontStyle === "italic" ? "bg-primary/15 text-primary" : "hover:bg-muted/80")}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* Alignment */}
              {(["left", "center", "right", "justify"] as TextAlign[]).map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : a === "right" ? AlignRight : AlignJustify;
                return (
                  <button
                    key={a}
                    onClick={() => updateBody({ textAlign: a })}
                    className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors", s.bodyStyle.textAlign === a ? "bg-primary/15 text-primary" : "hover:bg-muted/80")}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* List styles */}
              <button
                onClick={() => updateBody({ textAlign: "left" })}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors"
                title="Bullet list"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateBody({ textAlign: "left" })}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors"
                title="Numbered list"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors"
                title="Arrow list"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* Heading Color */}
              <div className="relative">
                <button
                  onClick={() => { closeAllDropdowns(); setShowHeadingColor(!showHeadingColor); }}
                  className="h-8 flex items-center gap-1 px-2 rounded-lg hover:bg-muted/80 transition-colors"
                  title="Warna Judul"
                >
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: s.headingStyle.color }} />
                  <span className="text-[9px] text-muted-foreground">H</span>
                </button>
                {showHeadingColor && (
                  <ColorPicker
                    value={s.headingStyle.color}
                    onChange={(c) => { updateHeading({ color: c }); updateStyling({ accentColor: c, tableHeaderBg: c }); }}
                    onClose={() => setShowHeadingColor(false)}
                    position="bottom"
                  />
                )}
              </div>

              {/* Body Color */}
              <div className="relative">
                <button
                  onClick={() => { closeAllDropdowns(); setShowBodyColor(!showBodyColor); }}
                  className="h-8 flex items-center gap-1 px-2 rounded-lg hover:bg-muted/80 transition-colors"
                  title="Warna Teks"
                >
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: s.bodyStyle.color }} />
                  <span className="text-[9px] text-muted-foreground">A</span>
                </button>
                {showBodyColor && (
                  <ColorPicker
                    value={s.bodyStyle.color}
                    onChange={(c) => updateBody({ color: c })}
                    onClose={() => setShowBodyColor(false)}
                    position="bottom"
                  />
                )}
              </div>

              {/* Page Background */}
              <div className="relative">
                <button
                  onClick={() => { closeAllDropdowns(); setShowBgColor(!showBgColor); }}
                  className="h-8 flex items-center gap-1 px-2 rounded-lg hover:bg-muted/80 transition-colors"
                  title="Background Halaman"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <div className="w-3 h-3 rounded border" style={{ backgroundColor: currentPageBg }} />
                </button>
                {showBgColor && (
                  <ColorPicker value={currentPageBg} onChange={updatePageBg} onClose={() => setShowBgColor(false)} position="bottom" />
                )}
              </div>

              <div className="h-5 w-px bg-border mx-0.5" />

              {/* Logo */}
              <button
                onClick={() => logoRef.current?.click()}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors"
                title="Upload Logo"
              >
                <ImagePlus className="w-3.5 h-3.5" />
              </button>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

              {/* Settings (Padding) */}
              <div className="relative">
                <button
                  onClick={() => { closeAllDropdowns(); setShowSettings(!showSettings); }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-colors"
                  title="Pengaturan Dokumen"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 bg-popover border rounded-xl shadow-2xl p-4 w-56 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Pengaturan</span>
                      <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Padding Dokumen</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={32}
                          max={96}
                          value={docPadding}
                          onChange={(e) => setDocPadding(Number(e.target.value))}
                          className="flex-1 h-1.5 accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-mono w-8 text-right">{docPadding}px</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Heading Size</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={11}
                          max={24}
                          value={s.headingStyle.fontSize}
                          onChange={(e) => updateHeading({ fontSize: Number(e.target.value) })}
                          className="flex-1 h-1.5 accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-mono w-8 text-right">{s.headingStyle.fontSize}px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Section Editor ── */}
        <div className="border-l overflow-y-auto bg-background">
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {renderSectionEditor()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Color Picker (opens upward from floating toolbar)
// =============================================================================

function ColorPicker({
  value,
  onChange,
  onClose,
  position = "top",
}: {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}) {
  return (
    <div className={cn(
      "absolute z-50 bg-popover border rounded-xl shadow-2xl p-3 w-[220px]",
      position === "bottom" ? "bottom-full mb-2 left-1/2 -translate-x-1/2" : "top-full mt-2 left-1/2 -translate-x-1/2"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pilih Warna</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { onChange(c); onClose(); }}
            className={cn("w-6 h-6 rounded-md border-2 transition-transform hover:scale-110", value === c ? "border-primary ring-1 ring-primary/30" : "border-transparent")}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 rounded border cursor-pointer" />
        <input
          type="text"
          value={value}
          onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
          className="flex-1 h-7 border rounded px-2 text-xs font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
