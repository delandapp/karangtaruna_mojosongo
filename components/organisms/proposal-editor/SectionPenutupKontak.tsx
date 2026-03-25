"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalData } from "@/lib/types/proposal-template.types";

interface Props {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export function SectionPenutupKontak({ data, onChange }: Props) {
  const p = data.penutupKontak;

  const update = (field: keyof typeof p, value: string) => {
    onChange({
      ...data,
      penutupKontak: { ...p, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Penutup & Kontak</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Akhiri proposal dengan ucapan terima kasih, ajakan bekerja sama, dan
          informasi kontak lengkap.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="penutup">Paragraf Penutup</Label>
        <Textarea
          id="penutup"
          value={p.penutup}
          onChange={(e) => update("penutup", e.target.value)}
          placeholder="Tuliskan kata penutup dan ajakan kerja sama..."
          rows={5}
          className="resize-y"
        />
      </div>

      <div className="border-t pt-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Informasi Kontak
        </p>

        <div className="space-y-2">
          <Label htmlFor="nama-kontak">Nama & Jabatan</Label>
          <Input
            id="nama-kontak"
            value={p.namaKontak}
            onChange={(e) => update("namaKontak", e.target.value)}
            placeholder="Contoh: Budi Santoso (Ketua Panitia)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="telepon">Telepon / WA</Label>
            <Input
              id="telepon"
              value={p.telepon}
              onChange={(e) => update("telepon", e.target.value)}
              placeholder="0812-3456-7890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-kontak">Email</Label>
            <Input
              id="email-kontak"
              value={p.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@contoh.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
