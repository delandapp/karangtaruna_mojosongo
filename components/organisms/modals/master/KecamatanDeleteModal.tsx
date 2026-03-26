"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteKecamatanMutation } from "@/features/api/kecamatanApi";

interface KecamatanDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  data: { id: number; nama: string; kota?: string } | null;
}

export function KecamatanDeleteModal({
  isOpen,
  onOpenChange,
  onSuccess,
  data,
}: KecamatanDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteKecamatan] = useDeleteKecamatanMutation();

  if (!data) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteKecamatan(data.id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Kecamatan ${data.nama} telah dihapus dari sistem.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description: error?.data?.error?.message || "Kesalahan jaringan saat menghapus data.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-destructive/10 text-destructive rounded-full">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Konfirmasi Hapus
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pt-2">
            Apakah Anda yakin ingin menghapus kecamatan <strong className="text-foreground">{data.nama}</strong>{" "}
            dari kota {data.kota}? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="bg-transparent border-border/50"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="shadow-lg shadow-destructive/20 transition-all hover:shadow-destructive/30"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : null}
            Hapus Kecamatan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
