"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHapusKontenMutation } from "@/features/api/sosialMediaApi";

interface ModalKonfirmasiHapusKontenProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  kontenId: number;
  kontenCaption: string;
}

export function ModalKonfirmasiHapusKonten({
  isOpen,
  onOpenChange,
  onSuccess,
  kontenId,
  kontenCaption,
}: ModalKonfirmasiHapusKontenProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hapusKonten] = useHapusKontenMutation();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await hapusKonten(kontenId).unwrap();
      toast.success("✅ Konten berhasil dihapus");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menghapus konten", {
        description: error?.data?.error?.message || error?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncatedCaption =
    kontenCaption.length > 60 ? kontenCaption.slice(0, 60) + "..." : kontenCaption;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-destructive">
            ⚠️ Hapus Konten
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            Apakah Anda yakin ingin menghapus konten postingan ini?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 border border-border/60 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-foreground mb-1">
            Caption Konten:
          </p>
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "{truncatedCaption || "Tidak ada caption"}"
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="bg-transparent border-border/50"
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="shadow-lg shadow-destructive/20 hover:shadow-destructive/30 transition-all font-semibold"
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Hapus Konten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
