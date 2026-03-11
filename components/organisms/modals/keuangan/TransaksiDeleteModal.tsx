"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

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
import { useDeleteTransaksiKeuanganMutation } from "@/features/api/keuanganApi";

interface TransaksiDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dataId: number | null;
  transaksiName?: string;
  onSuccess: () => void;
}

export function TransaksiDeleteModal({
  isOpen,
  onOpenChange,
  dataId,
  transaksiName,
  onSuccess,
}: TransaksiDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTransaksi] = useDeleteTransaksiKeuanganMutation();

  const handleDelete = async () => {
    if (!dataId) return;

    setIsDeleting(true);
    try {
      await deleteTransaksi(dataId).unwrap();
      toast.success("Catatan Transaksi berhasil dihapus", {
        description: `Transaksi ${transaksiName ? `"${transaksiName}"` : "tersebut"} telah dihapus permanen dari sistem.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menghapus catatan transaksi", {
        description: error?.data?.error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Hapus Catatan Transaksi</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Apakah Anda yakin ingin menghapus catatan transaksi{" "}
            <span className="font-semibold text-foreground">
              {transaksiName || "ini"}
            </span>
            ? Data transaksi yang dihapus tidak dapat dipulihkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel
            disabled={isDeleting}
            className="bg-transparent border-border/50"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-600/20"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
