"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ProposalData, StrukturPanitiaItem } from "@/lib/types/proposal-template.types";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionStrukturPanitia({ data, onChange }: Props) {
  const [newNama, setNewNama] = useState("");
  const [newPosisi, setNewPosisi] = useState("");

  const updatePanitia = (panitia: StrukturPanitiaItem[]) => {
    onChange({ ...data, strukturPanitia: panitia });
  };

  const addPanitia = () => {
    if (newNama.trim() && newPosisi.trim()) {
      updatePanitia([
        ...data.strukturPanitia,
        { nama: newNama.trim(), posisi: newPosisi.trim() },
      ]);
      setNewNama("");
      setNewPosisi("");
    }
  };

  const removePanitia = (index: number) => {
    updatePanitia(data.strukturPanitia.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof StrukturPanitiaItem, value: string) => {
    const updated = [...data.strukturPanitia];
    updated[index] = { ...updated[index], [field]: value };
    updatePanitia(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Struktur Panitia</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Cantumkan susunan panitia untuk menunjukkan bahwa acara dikelola
          dengan sistematis.
        </p>
      </div>

      <Label>Daftar Panitia ({data.strukturPanitia.length} orang)</Label>

      <div className="space-y-1.5">
        {data.strukturPanitia.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
              {i + 1}.
            </span>
            <Input
              value={item.nama}
              onChange={(e) => updateRow(i, "nama", e.target.value)}
              className="flex-1 text-sm h-9"
              placeholder="Nama"
            />
            <Input
              value={item.posisi}
              onChange={(e) => updateRow(i, "posisi", e.target.value)}
              className="flex-1 text-sm h-9"
              placeholder="Posisi / Jabatan"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removePanitia(i)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div className="flex items-center gap-2 pt-1">
        <span className="w-5 shrink-0" />
        <Input
          value={newNama}
          onChange={(e) => setNewNama(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPanitia())}
          placeholder="Nama baru"
          className="flex-1 text-sm h-9"
        />
        <Input
          value={newPosisi}
          onChange={(e) => setNewPosisi(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPanitia())}
          placeholder="Posisi"
          className="flex-1 text-sm h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addPanitia}
          disabled={!newNama.trim() || !newPosisi.trim()}
          className="h-9 w-9 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
