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

export function SectionProfilPeserta({ data, onChange }: Props) {
  const p = data.profilPeserta;

  const update = (field: keyof typeof p, value: string) => {
    onChange({
      ...data,
      profilPeserta: { ...p, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-1">Profil Peserta & Target Audiens</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sajikan data demografis dan psikografis agar sponsor bisa menilai
          kesesuaian dengan target pasar mereka.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="usia">Rentang Usia</Label>
          <Input
            id="usia"
            value={p.usia}
            onChange={(e) => update("usia", e.target.value)}
            placeholder="Contoh: 17–30 tahun"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Input
            id="gender"
            value={p.gender}
            onChange={(e) => update("gender", e.target.value)}
            placeholder="Contoh: Laki-laki & Perempuan"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="profesi">Profesi / Latar Belakang</Label>
        <Input
          id="profesi"
          value={p.profesi}
          onChange={(e) => update("profesi", e.target.value)}
          placeholder="Contoh: Pelajar, Mahasiswa, Pemuda, UMKM"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lokasi">Lokasi</Label>
        <Input
          id="lokasi"
          value={p.lokasi}
          onChange={(e) => update("lokasi", e.target.value)}
          placeholder="Contoh: Kecamatan Mojosongo dan sekitarnya"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="narasi-audiens">Narasi Audiens</Label>
        <Textarea
          id="narasi-audiens"
          value={p.narasi}
          onChange={(e) => update("narasi", e.target.value)}
          placeholder="Tuliskan deskripsi naratif tentang peserta dan audiens..."
          rows={5}
          className="resize-y"
        />
      </div>
    </div>
  );
}
