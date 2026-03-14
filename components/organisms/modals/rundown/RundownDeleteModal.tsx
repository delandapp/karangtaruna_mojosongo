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

import { useDeleteRundownMutation } from "@/features/api/rundownApi";

interface RundownDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  rundownId: number | null;
  activityName?: string;
  onSuccess?: () => void;
}

export function RundownDeleteModal({
  isOpen,
  onOpenChange,
  eventId,
  rundownId,
  activityName,
  onSuccess,
}: RundownDeleteModalProps) {
  const [deleteData, { isLoading }] = useDeleteRundownMutation();

  const handleDelete = async () => {
    if (!rundownId) return;
    try {
      await deleteData({ eventId, id: rundownId }).unwrap();
      toast.success("Berhasil dihapus", {
        description: activityName
          ? `Kegiatan "${activityName}" telah dihapus dari rundown.`
          : "Data rundown berhasil dihapus.",
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
          <DialogTitle>Hapus Kegiatan Rundown</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus{" "}
            {activityName ? (
              <span className="font-semibold text-foreground">"{activityName}"</span>
            ) : (
              "kegiatan ini"
            )}{" "}
            dari rundown acara? Tindakan ini tidak dapat dibatalkan.
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
