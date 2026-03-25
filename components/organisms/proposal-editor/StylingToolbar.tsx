"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  ImagePlus,
  ChevronDown,
} from "lucide-react";
import type {
  ProposalData,
  ProposalStyling,
  FontFamily,
  TextAlign,
} from "@/lib/types/proposal-template.types";
import { AVAILABLE_FONTS, PRESET_COLORS } from "@/lib/types/proposal-template.types";
import { cn } from "@/lib/utils";

interface StylingToolbarProps {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
  activeSectionIndex: number;
}

export function StylingToolbar({
  data,
  onChange,
  activeSectionIndex,
}: StylingToolbarProps) {
  const s = data.styling;
  const [showHeadingColor, setShowHeadingColor] = useState(false);
  const [showBodyColor, setShowBodyColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  const updateStyling = (patch: Partial<ProposalStyling>) => {
    onChange({ ...data, styling: { ...s, ...patch } });
  };

  const updateHeading = (patch: Partial<typeof s.headingStyle>) => {
    updateStyling({ headingStyle: { ...s.headingStyle, ...patch } });
  };

  const updateBody = (patch: Partial<typeof s.bodyStyle>) => {
    updateStyling({ bodyStyle: { ...s.bodyStyle, ...patch } });
  };

  const updatePageBg = (color: string) => {
    const newPageStyles = [...s.pageStyles];
    newPageStyles[activeSectionIndex] = {
      ...newPageStyles[activeSectionIndex],
      backgroundColor: color,
    };
    updateStyling({ pageStyles: newPageStyles });
  };

  const currentPageBg =
    s.pageStyles[activeSectionIndex]?.backgroundColor || "#ffffff";

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Maks 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ ...data, logoUrl: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-background/95 backdrop-blur overflow-x-auto shrink-0">
      {/* ── Font Family ── */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowFontDropdown(!showFontDropdown);
            setShowHeadingColor(false);
            setShowBodyColor(false);
            setShowBgColor(false);
          }}
          className="h-7 gap-1 text-xs font-normal px-2 min-w-[100px] justify-between"
        >
          <Type className="w-3 h-3 shrink-0" />
          <span className="truncate">{s.bodyStyle.fontFamily}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </Button>
        {showFontDropdown && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 w-48 max-h-52 overflow-y-auto">
            {AVAILABLE_FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  updateBody({ fontFamily: f.value });
                  updateHeading({ fontFamily: f.value });
                  setShowFontDropdown(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors",
                  s.bodyStyle.fontFamily === f.value && "bg-primary/10 text-primary font-medium"
                )}
                style={{ fontFamily: f.value }}
              >
                {f.label}
                <span className="text-[10px] text-muted-foreground ml-1.5">
                  {f.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* ── Font Size ── */}
      <select
        value={s.bodyStyle.fontSize}
        onChange={(e) => updateBody({ fontSize: Number(e.target.value) })}
        className="h-7 w-14 rounded border bg-transparent text-xs px-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24].map((sz) => (
          <option key={sz} value={sz}>
            {sz}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* ── Bold / Italic ── */}
      <Button
        variant={s.bodyStyle.fontWeight === "bold" ? "secondary" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() =>
          updateBody({
            fontWeight: s.bodyStyle.fontWeight === "bold" ? "normal" : "bold",
          })
        }
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant={s.bodyStyle.fontStyle === "italic" ? "secondary" : "ghost"}
        size="icon"
        className="h-7 w-7"
        onClick={() =>
          updateBody({
            fontStyle: s.bodyStyle.fontStyle === "italic" ? "normal" : "italic",
          })
        }
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* ── Alignment ── */}
      {(["left", "center", "right", "justify"] as TextAlign[]).map((a) => {
        const Icon =
          a === "left" ? AlignLeft :
          a === "center" ? AlignCenter :
          a === "right" ? AlignRight : AlignJustify;
        return (
          <Button
            key={a}
            variant={s.bodyStyle.textAlign === a ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => updateBody({ textAlign: a })}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        );
      })}

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* ── Heading Color ── */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowHeadingColor(!showHeadingColor);
            setShowBodyColor(false);
            setShowBgColor(false);
            setShowFontDropdown(false);
          }}
          className="h-7 gap-1 text-xs px-2"
        >
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: s.headingStyle.color }} />
          <span className="text-[10px]">Judul</span>
        </Button>
        {showHeadingColor && (
          <ColorPicker
            value={s.headingStyle.color}
            onChange={(c) => {
              updateHeading({ color: c });
              updateStyling({ accentColor: c, tableHeaderBg: c });
            }}
            onClose={() => setShowHeadingColor(false)}
          />
        )}
      </div>

      {/* ── Body Color ── */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowBodyColor(!showBodyColor);
            setShowHeadingColor(false);
            setShowBgColor(false);
            setShowFontDropdown(false);
          }}
          className="h-7 gap-1 text-xs px-2"
        >
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: s.bodyStyle.color }} />
          <span className="text-[10px]">Teks</span>
        </Button>
        {showBodyColor && (
          <ColorPicker
            value={s.bodyStyle.color}
            onChange={(c) => updateBody({ color: c })}
            onClose={() => setShowBodyColor(false)}
          />
        )}
      </div>

      {/* ── Page Background ── */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowBgColor(!showBgColor);
            setShowHeadingColor(false);
            setShowBodyColor(false);
            setShowFontDropdown(false);
          }}
          className="h-7 gap-1 text-xs px-2"
        >
          <Palette className="w-3 h-3" />
          <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: currentPageBg }} />
          <span className="text-[10px]">BG</span>
        </Button>
        {showBgColor && (
          <ColorPicker
            value={currentPageBg}
            onChange={updatePageBg}
            onClose={() => setShowBgColor(false)}
          />
        )}
      </div>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* ── Logo Upload ── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => logoRef.current?.click()}
        className="h-7 gap-1 text-xs px-2"
      >
        <ImagePlus className="w-3 h-3" />
        <span className="text-[10px]">Logo</span>
      </Button>
      <input
        ref={logoRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
    </div>
  );
}

// =============================================================================
// Color Picker Sub-component
// =============================================================================

function ColorPicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-popover border rounded-lg shadow-lg p-3 w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Pilih Warna
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => { onChange(c); onClose(); }}
            className={cn(
              "w-6 h-6 rounded-md border-2 transition-transform hover:scale-110",
              value === c ? "border-primary ring-1 ring-primary/30" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded border cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className="flex-1 h-7 border rounded px-2 text-xs font-mono bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
