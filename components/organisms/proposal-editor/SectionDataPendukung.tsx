"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ProposalData, StatistikItem, TrendItem } from "@/lib/types/proposal-template.types";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionDataPendukung({ data, onChange }: Props) {
  const dp = data.dataPendukung;

  const updateDP = (patch: Partial<typeof dp>) =>
    onChange({ ...data, dataPendukung: { ...dp, ...patch } });

  const addStatistik = () =>
    updateDP({ statistik: [...dp.statistik, { label: "", value: "", icon: "" }] });

  const removeStatistik = (i: number) =>
    updateDP({ statistik: dp.statistik.filter((_, j) => j !== i) });

  const updateStatistik = (i: number, patch: Partial<StatistikItem>) => {
    const ns = [...dp.statistik];
    ns[i] = { ...ns[i], ...patch };
    updateDP({ statistik: ns });
  };

  const addTrend = () =>
    updateDP({ trendPopuler: [...dp.trendPopuler, { judul: "", deskripsi: "" }] });

  const removeTrend = (i: number) =>
    updateDP({ trendPopuler: dp.trendPopuler.filter((_, j) => j !== i) });

  const updateTrend = (i: number, patch: Partial<TrendItem>) => {
    const nt = [...dp.trendPopuler];
    nt[i] = { ...nt[i], ...patch };
    updateDP({ trendPopuler: nt });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-1">Data Pendukung</h3>
        <p className="text-[11px] text-muted-foreground">
          Statistik dan trend yang mendukung relevansi acara bagi sponsor.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Narasi</Label>
        <Textarea
          value={dp.narasi}
          onChange={(e) => updateDP({ narasi: e.target.value })}
          placeholder="Jelaskan data pendukung secara ringkas..."
          rows={3}
          className="resize-y"
        />
      </div>

      {/* Statistik */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Statistik</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStatistik} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> Tambah
          </Button>
        </div>
        {dp.statistik.map((stat, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <Input
                value={stat.label}
                onChange={(e) => updateStatistik(i, { label: e.target.value })}
                placeholder="Label (cth: Total Penduduk)"
                className="h-8 text-xs"
              />
              <Input
                value={stat.value}
                onChange={(e) => updateStatistik(i, { value: e.target.value })}
                placeholder="Nilai (cth: 45.000+)"
                className="h-8 text-xs"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeStatistik(i)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Trend */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Trend Populer</Label>
          <Button type="button" variant="outline" size="sm" onClick={addTrend} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> Tambah
          </Button>
        </div>
        {dp.trendPopuler.map((trend, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1.5">
              <Input
                value={trend.judul}
                onChange={(e) => updateTrend(i, { judul: e.target.value })}
                placeholder="Judul trend"
                className="h-8 text-xs"
              />
              <Textarea
                value={trend.deskripsi}
                onChange={(e) => updateTrend(i, { deskripsi: e.target.value })}
                placeholder="Deskripsi singkat..."
                rows={2}
                className="text-xs resize-y"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeTrend(i)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Sumber Data</Label>
        <Input
          value={dp.sumberData}
          onChange={(e) => updateDP({ sumberData: e.target.value })}
          placeholder="BPS, Survey Internal, dll."
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
