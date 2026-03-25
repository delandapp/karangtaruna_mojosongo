"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalData } from "@/lib/types/proposal-template.types";
import { ImageUploader } from "./ImageUploader";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionLatarBelakang({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Latar Belakang Acara</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Jelaskan mengapa acara ini penting untuk diselenggarakan dan
          permasalahan apa yang ingin dijawab.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="latar-belakang">Paragraf Latar Belakang</Label>
        <Textarea
          id="latar-belakang"
          value={data.latarBelakang}
          onChange={(e) =>
            onChange({ ...data, latarBelakang: e.target.value })
          }
          placeholder="Tuliskan konteks, latar belakang, dan alasan penyelenggaraan acara..."
          rows={8}
          className="resize-y"
        />
        <p className="text-[11px] text-muted-foreground text-right">
          {data.latarBelakang.length} karakter
        </p>
      </div>

      <div className="space-y-2">
        <Label>Gambar Cover / Banner</Label>
        <ImageUploader
          value={data.images.latar_belakang}
          onChange={(url) =>
            onChange({
              ...data,
              images: { ...data.images, latar_belakang: url || "" },
            })
          }
          label="Upload gambar cover"
          hint="Gambar banner atau foto acara sebelumnya"
        />
      </div>
    </div>
  );
}
