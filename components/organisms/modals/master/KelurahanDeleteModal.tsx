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
import { useDeleteKelurahanMutation } from "@/features/api/kelurahanApi";

interface KelurahanDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  data: { id: number; nama: string; kecamatan?: string } | null;
}

export function KelurahanDeleteModal({
  isOpen,
  onOpenChange,
  onSuccess,
  data,
}: KelurahanDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteKelurahan] = useDeleteKelurahanMutation();

  if (!data) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteKelurahan(data.id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Kelurahan ${data.nama} telah dihapus dari sistem.`,
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
            Apakah Anda yakin ingin menghapus kelurahan <strong className="text-foreground">{data.nama}</strong>{" "}
            dari kecamatan {data.kecamatan}? Tindakan ini tidak dapat dibatalkan.
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
            Hapus Kelurahan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
