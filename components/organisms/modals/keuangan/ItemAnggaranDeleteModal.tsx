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
import { useDeleteItemAnggaranMutation } from "@/features/api/keuanganApi";

interface ItemAnggaranDeleteModalProps {
  eventId: number;
  anggaranId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dataId: number | null;
  itemName?: string;
  onSuccess: () => void;
}

export function ItemAnggaranDeleteModal({
  eventId,
  anggaranId,
  isOpen,
  onOpenChange,
  dataId,
  itemName,
  onSuccess,
}: ItemAnggaranDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteItem] = useDeleteItemAnggaranMutation();

  const handleDelete = async () => {
    if (!dataId) return;

    setIsDeleting(true);
    try {
      await deleteItem({ id: dataId, eventId, anggaranId }).unwrap();
      toast.success("Item Anggaran berhasil dihapus", {
        description: `Item ${itemName || "tersebut"} telah dihapus permanen.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menghapus item anggaran", {
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
            <AlertDialogTitle>Hapus Item Anggaran</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Apakah Anda yakin ingin menghapus item{" "}
            <span className="font-semibold text-foreground">
              {itemName || "ini"}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
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
