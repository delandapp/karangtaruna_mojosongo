"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useDeletePanitiaMutation } from "@/features/api/panitiaApi";

interface SusunanPanitiaDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  panitiaId: number | null;
  memberName?: string;
  onSuccess?: () => void;
}

export function SusunanPanitiaDeleteModal({
  isOpen,
  onOpenChange,
  eventId,
  panitiaId,
  memberName,
  onSuccess,
}: SusunanPanitiaDeleteModalProps) {
  const [deleteData, { isLoading }] = useDeletePanitiaMutation();

  const handleDelete = async () => {
    if (!panitiaId) return;
    try {
      await deleteData({ eventId, id: panitiaId }).unwrap();
      toast.success("Berhasil dihapus", {
        description: memberName
          ? `${memberName} telah dihapus dari kepanitiaan.`
          : "Data panitia berhasil dihapus.",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description: error?.data?.error?.message || "Kesalahan jaringan.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle>Hapus Anggota Panitia</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus{" "}
            {memberName ? (
              <span className="font-semibold text-foreground">{memberName}</span>
            ) : (
              "anggota ini"
            )}{" "}
            dari kepanitiaan? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-row justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
