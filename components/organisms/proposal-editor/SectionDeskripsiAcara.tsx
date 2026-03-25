"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalData } from "@/lib/types/proposal-template.types";
import { ImageUploader } from "./ImageUploader";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionDeskripsiAcara({ data, onChange }: Props) {
  const d = data.deskripsiAcara;

  const update = (field: keyof typeof d, value: string) => {
    onChange({
      ...data,
      deskripsiAcara: { ...d, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Deskripsi Acara</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Jelaskan detail acara agar sponsor bisa membayangkan skala dan
          profesionalitas kegiatan.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tema">Tema Acara</Label>
        <Input
          id="tema"
          value={d.tema}
          onChange={(e) => update("tema", e.target.value)}
          placeholder='Contoh: "Bersama Membangun Generasi Muda yang Berdaya"'
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bentuk">Bentuk Kegiatan</Label>
        <Input
          id="bentuk"
          value={d.bentukKegiatan}
          onChange={(e) => update("bentukKegiatan", e.target.value)}
          placeholder="Contoh: Seminar, Workshop, Lomba, Bazar, Konser"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="jadwal">Jadwal</Label>
          <Input
            id="jadwal"
            value={d.jadwal}
            onChange={(e) => update("jadwal", e.target.value)}
            placeholder="Contoh: 2 hari (Sabtu - Minggu)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="peserta">Jumlah Peserta</Label>
          <Input
            id="peserta"
            value={d.jumlahPeserta}
            onChange={(e) => update("jumlahPeserta", e.target.value)}
            placeholder="Contoh: 500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="detail-deskripsi">Detail Deskripsi</Label>
        <Textarea
          id="detail-deskripsi"
          value={d.detail}
          onChange={(e) => update("detail", e.target.value)}
          placeholder="Tuliskan deskripsi lengkap acara..."
          rows={5}
          className="resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label>Foto Acara</Label>
        <ImageUploader
          value={data.images.deskripsi_acara}
          onChange={(url) =>
            onChange({
              ...data,
              images: { ...data.images, deskripsi_acara: url || "" },
            })
          }
          label="Upload foto acara"
          hint="Foto acara sebelumnya atau dokumentasi"
        />
      </div>
    </div>
  );
}
