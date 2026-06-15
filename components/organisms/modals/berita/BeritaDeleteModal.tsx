"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteBeritaMutation, type Berita } from "@/features/api/beritaApi";

interface BeritaDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  berita: Pick<Berita, "id" | "judul"> | null;
}

export function BeritaDeleteModal({ isOpen, onOpenChange, onSuccess, berita }: BeritaDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBerita] = useDeleteBeritaMutation();

  const handleDelete = async () => {
    if (!berita) return;
    setIsDeleting(true);
    try {
      await deleteBerita(berita.id).unwrap();
      toast.success("Berita berhasil dihapus", {
        description: `"${berita.judul}" telah dihapus dari sistem.`,
      });
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menghapus berita", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-semibold">Hapus Berita?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tindakan ini tidak dapat dibatalkan. Berita akan dihapus secara permanen dari sistem.
          </DialogDescription>
        </DialogHeader>

        {berita && (
          <div className="mx-auto max-w-sm rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-center">
            <p className="text-sm font-medium text-foreground line-clamp-2">"{berita.judul}"</p>
          </div>
        )}

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="bg-transparent border-border/60"
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 shadow-lg shadow-destructive/20"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Hapus Berita
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
