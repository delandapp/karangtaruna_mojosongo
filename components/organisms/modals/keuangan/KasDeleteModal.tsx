"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteKasMutation } from "@/features/api/keuanganApi";

interface KasDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dataId: number | null;
  nomorKas?: string;
  onSuccess: () => void;
}

export function KasDeleteModal({
  isOpen,
  onOpenChange,
  dataId,
  nomorKas,
  onSuccess,
}: KasDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteKas] = useDeleteKasMutation();

  const handleDelete = async () => {
    if (!dataId) return;
    setIsDeleting(true);
    try {
      await deleteKas(dataId).unwrap();
      toast.success("✅ Data kas berhasil dihapus");
      onSuccess();
    } catch (error: unknown) {
      const err = error as { data?: { error?: { message?: string } } };
      toast.error("Gagal menghapus data kas", {
        description: err?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Hapus Data Kas</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1">
            Anda yakin ingin menghapus{" "}
            {nomorKas ? (
              <>
                data kas{" "}
                <span className="font-semibold text-foreground">{nomorKas}</span>?
              </>
            ) : (
              "data kas ini?"
            )}{" "}
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel disabled={isDeleting} className="bg-transparent border-border/50">
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
