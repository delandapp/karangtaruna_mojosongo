"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ProposalData, AlokasiAnggaran } from "@/lib/types/proposal-template.types";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionAnggaranDana({ data, onChange }: Props) {
  const a = data.anggaranDana;
  const [newKategori, setNewKategori] = useState("");
  const [newPersen, setNewPersen] = useState("");

  const updateAlokasi = (alokasi: AlokasiAnggaran[]) => {
    onChange({ ...data, anggaranDana: { ...a, alokasi } });
  };

  const addAlokasi = () => {
    if (newKategori.trim() && newPersen) {
      updateAlokasi([
        ...a.alokasi,
        { kategori: newKategori.trim(), persentase: Number(newPersen) },
      ]);
      setNewKategori("");
      setNewPersen("");
    }
  };

  const removeAlokasi = (index: number) => {
    updateAlokasi(a.alokasi.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof AlokasiAnggaran, value: string) => {
    const updated = [...a.alokasi];
    if (field === "persentase") {
      updated[index] = { ...updated[index], persentase: Number(value) || 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    updateAlokasi(updated);
  };

  const totalPersen = a.alokasi.reduce((sum, item) => sum + item.persentase, 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Anggaran Dana</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Tunjukkan transparansi dan profesionalisme dengan merincikan alokasi anggaran.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-anggaran">Total Anggaran</Label>
        <Input
          id="total-anggaran"
          value={a.totalAnggaran}
          onChange={(e) =>
            onChange({ ...data, anggaranDana: { ...a, totalAnggaran: e.target.value } })
          }
          placeholder="Contoh: Rp 10.000.000"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Alokasi Anggaran</Label>
          <span
            className={`text-xs font-medium ${
              totalPersen === 100
                ? "text-green-600"
                : totalPersen > 100
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            Total: {totalPersen}%
          </span>
        </div>

        {/* Table rows */}
        <div className="space-y-1.5">
          {a.alokasi.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={item.kategori}
                onChange={(e) => updateRow(i, "kategori", e.target.value)}
                className="flex-1 text-sm h-9"
                placeholder="Kategori"
              />
              <div className="flex items-center gap-1 w-20 shrink-0">
                <Input
                  type="number"
                  value={item.persentase}
                  onChange={(e) => updateRow(i, "persentase", e.target.value)}
                  className="text-sm h-9 text-right"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAlokasi(i)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add row */}
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={newKategori}
            onChange={(e) => setNewKategori(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAlokasi())}
            placeholder="Kategori baru"
            className="flex-1 text-sm h-9"
          />
          <div className="flex items-center gap-1 w-20 shrink-0">
            <Input
              type="number"
              value={newPersen}
              onChange={(e) => setNewPersen(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAlokasi())}
              placeholder="%"
              className="text-sm h-9 text-right"
              min={0}
              max={100}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addAlokasi}
            disabled={!newKategori.trim() || !newPersen}
            className="h-9 w-9 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
