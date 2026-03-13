"use client";

import React, { useState, useCallback, useRef } from "react";
import { Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

import { useGetPanitiaQuery, type AnggotaPanitia } from "@/features/api/panitiaApi";
import { PanitiaOrgChart } from "@/components/organisms/event/panitia/PanitiaOrgChart";
import { SusunanPanitiaFormModal } from "@/components/organisms/modals/susunan-panitia/SusunanPanitiaFormModal";
import { SusunanPanitiaDeleteModal } from "@/components/organisms/modals/susunan-panitia/SusunanPanitiaDeleteModal";

// ── Types ────────────────────────────────────────────────────────────────────
interface TabPanitiaProps {
  eventId: number;
  onRegisterAdd?: (fn: () => void) => void;
  onRegisterRefresh?: (fn: () => void) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function TabPanitia({ eventId, onRegisterAdd, onRegisterRefresh }: TabPanitiaProps) {
  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    data: response,
    isFetching,
    refetch,
  } = useGetPanitiaQuery({ eventId, limit: 100 });

  const panitiaList: AnggotaPanitia[] = response?.data ?? [];

  // ── Modal state ───────────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AnggotaPanitia | null>(null);

  const handleOpenForm = useCallback((member?: AnggotaPanitia) => {
    setSelectedMember(member ?? null);
    setIsFormOpen(true);
  }, []);

  const handleOpenDelete = useCallback((member: AnggotaPanitia) => {
    setSelectedMember(member);
    setIsDeleteOpen(true);
  }, []);

  // ── Register Add & Refresh fn for parent toolbar ───────────────────────────
  const registeredRef = useRef(false);
  React.useEffect(() => {
    if (!registeredRef.current) {
      registeredRef.current = true;
      onRegisterAdd?.(() => handleOpenForm());
      onRegisterRefresh?.(() => refetch());
    }
  }, [onRegisterAdd, onRegisterRefresh, handleOpenForm, refetch]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const koordinatorCount = panitiaList.filter((p) => p.posisi === "Koordinator").length;
  const anggotaCount = panitiaList.filter((p) => p.posisi === "Anggota").length;
  const aktifCount = panitiaList.filter((p) => p.is_aktif).length;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isFetching && panitiaList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Memuat susunan panitia...</span>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (panitiaList.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-14 text-center text-muted-foreground bg-muted/10 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Belum ada Panitia</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan anggota untuk membentuk susunan kepanitiaan event ini.
            </p>
          </div>
          <Button onClick={() => handleOpenForm()} className="mt-1">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Panitia
          </Button>
        </div>

        <SusunanPanitiaFormModal
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          eventId={eventId}
          initialData={selectedMember}
          onSuccess={refetch}
        />
      </>
    );
  }

  // ── Main View ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Stats Bar — hanya info, tanpa tombol aksi ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{panitiaList.length} Total</span>
        </div>
        <Badge variant="outline" className="text-xs rounded-full">
          {koordinatorCount} Koordinator
        </Badge>
        <Badge variant="outline" className="text-xs rounded-full">
          {anggotaCount} Anggota
        </Badge>
        <Badge variant="secondary" className="text-xs rounded-full">
          {aktifCount} Aktif
        </Badge>
      </div>

      {/* ── Org Chart Canvas ── */}
      <PanitiaOrgChart
        panitia={panitiaList}
        onEdit={handleOpenForm}
        onDelete={handleOpenDelete}
      />

      {/* ── Hint ── */}
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Klik dan seret node untuk menyesuaikan tata letak. Gunakan scroll untuk zoom.
      </p>

      {/* ── Modals ── */}
      <SusunanPanitiaFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={eventId}
        initialData={selectedMember}
        onSuccess={refetch}
      />
      <SusunanPanitiaDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        eventId={eventId}
        panitiaId={selectedMember?.id ?? null}
        memberName={selectedMember?.user?.nama_lengkap}
        onSuccess={refetch}
      />
    </div>
  );
}
