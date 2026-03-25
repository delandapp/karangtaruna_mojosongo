"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { ProposalData } from "@/lib/types/proposal-template.types";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0 text-right">
              {index + 1}.
            </span>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1 text-sm h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(index)}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder={placeholder}
          className="flex-1 text-sm h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="h-9 gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </Button>
      </div>
    </div>
  );
}

export function SectionTujuanManfaat({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">Tujuan & Manfaat Kegiatan</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Tuliskan tujuan acara dan manfaat yang didapat sponsor. Pastikan bersifat
          win-win solution.
        </p>
      </div>

      <ListEditor
        label="Tujuan Acara"
        items={data.tujuanAcara}
        onChange={(items) => onChange({ ...data, tujuanAcara: items })}
        placeholder="Tambahkan tujuan acara..."
      />

      <div className="border-t pt-4" />

      <ListEditor
        label="Manfaat bagi Sponsor"
        items={data.manfaatSponsor}
        onChange={(items) => onChange({ ...data, manfaatSponsor: items })}
        placeholder="Tambahkan manfaat untuk sponsor..."
      />
    </div>
  );
}
