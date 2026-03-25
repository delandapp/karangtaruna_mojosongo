"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { ProposalData, PaketSponsorshipItem } from "@/lib/types/proposal-template.types";
import { PRESET_COLORS } from "@/lib/types/proposal-template.types";
import { ImageUploader } from "./ImageUploader";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionPaketSponsorship({ data, onChange }: Props) {
  const [expandedPaket, setExpandedPaket] = useState<number | null>(0);

  const updatePakets = (pakets: PaketSponsorshipItem[]) => {
    onChange({ ...data, paketSponsorship: pakets });
  };

  const addPaket = () => {
    const newPakets = [
      ...data.paketSponsorship,
      { nama: "Paket Baru", nilai: "", benefits: [], headerColor: data.styling.accentColor },
    ];
    updatePakets(newPakets);
    setExpandedPaket(newPakets.length - 1);
  };

  const removePaket = (index: number) => {
    updatePakets(data.paketSponsorship.filter((_, i) => i !== index));
    if (expandedPaket === index) setExpandedPaket(null);
  };

  const updatePaket = (index: number, field: keyof PaketSponsorshipItem, value: any) => {
    const updated = [...data.paketSponsorship];
    updated[index] = { ...updated[index], [field]: value };
    updatePakets(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Paket Sponsorship</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Rincikan pilihan paket sponsor beserta nilai kontribusi dan benefit masing-masing.
        </p>
      </div>

      <div className="space-y-3">
        {data.paketSponsorship.map((paket, i) => {
          const isExpanded = expandedPaket === i;
          return (
            <div
              key={i}
              className="border rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 bg-muted/40 cursor-pointer"
                onClick={() => setExpandedPaket(isExpanded ? null : i)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold">{paket.nama || "Tanpa Nama"}</span>
                  {paket.nilai && (
                    <span className="text-xs text-muted-foreground">• {paket.nilai}</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePaket(i);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Body */}
              {isExpanded && (
                <div className="px-3 py-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Nama Paket</Label>
                      <Input
                        value={paket.nama}
                        onChange={(e) => updatePaket(i, "nama", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Contoh: Platinum"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nilai Sponsorship</Label>
                      <Input
                        value={paket.nilai}
                        onChange={(e) => updatePaket(i, "nilai", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Contoh: Rp 15.000.000"
                      />
                    </div>
                  </div>

                  <BenefitListEditor
                    benefits={paket.benefits}
                    onChange={(benefits) => updatePaket(i, "benefits", benefits)}
                  />

                  {/* Header Color */}
                  <div className="space-y-1.5 pt-2 border-t">
                    <Label className="text-xs">Warna Header Sponsor</Label>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.slice(0, 14).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updatePaket(i, "headerColor", c)}
                          className={`w-5 h-5 rounded border-2 transition-transform hover:scale-110 ${
                            paket.headerColor === c ? "border-primary ring-1 ring-primary/30" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={paket.headerColor || data.styling.accentColor}
                        onChange={(e) => updatePaket(i, "headerColor", e.target.value)}
                        className="w-5 h-5 rounded border cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Header Background Image */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Background Image Header</Label>
                    <ImageUploader
                      value={paket.headerBgImage}
                      onChange={(url) => updatePaket(i, "headerBgImage", url || "")}
                      label="Upload background header"
                      hint="Tampil di belakang header paket"
                      compact
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPaket}
        className="w-full gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah Paket Sponsorship
      </Button>

      <div className="space-y-2 pt-2 border-t">
        <p className="text-xs font-medium">Gambar Pendukung</p>
        <ImageUploader
          value={data.images.paket_sponsorship}
          onChange={(url) =>
            onChange({
              ...data,
              images: { ...data.images, paket_sponsorship: url || "" },
            })
          }
          label="Upload mockup booth / branding"
          hint="Visual pendukung paket sponsorship"
          compact
        />
      </div>
    </div>
  );
}

// ─── Benefit List Sub-editor ─────────────────────────────────────────────────

function BenefitListEditor({
  benefits,
  onChange,
}: {
  benefits: string[];
  onChange: (benefits: string[]) => void;
}) {
  const [newBenefit, setNewBenefit] = useState("");

  const addBenefit = () => {
    if (newBenefit.trim()) {
      onChange([...benefits, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    onChange(benefits.filter((_, i) => i !== index));
  };

  const updateBenefit = (index: number, value: string) => {
    const updated = [...benefits];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">Benefit ({benefits.length})</Label>
      {benefits.map((b, j) => (
        <div key={j} className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">•</span>
          <Input
            value={b}
            onChange={(e) => updateBenefit(j, e.target.value)}
            className="flex-1 text-xs h-7"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeBenefit(j)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-4 shrink-0" />
        <Input
          value={newBenefit}
          onChange={(e) => setNewBenefit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
          placeholder="Tambah benefit..."
          className="flex-1 text-xs h-7"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={addBenefit}
          disabled={!newBenefit.trim()}
          className="h-7 w-7 shrink-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
