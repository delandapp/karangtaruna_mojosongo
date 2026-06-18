"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublishKontenMutation } from "@/features/api/sosialMediaApi";

interface ModalPublishSekarangProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  kontenId: number;
  platforms: { nama: string }[];
}

export function ModalPublishSekarang({
  isOpen,
  onOpenChange,
  onSuccess,
  kontenId,
  platforms,
}: ModalPublishSekarangProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishKonten] = usePublishKontenMutation();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await publishKonten(kontenId).unwrap();
      toast.success("✅ Konten berhasil dipublikasikan sekarang!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal mempublikasikan konten", {
        description: error?.data?.error?.message || error?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            🚀 Publikasikan Konten
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            Apakah Anda yakin ingin mempublikasikan konten postingan ini sekarang?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-foreground">
            Platform Tujuan Publikasi:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="bg-primary/5 border-primary/20 text-primary text-xs py-0.5 px-2 rounded-full font-medium"
              >
                {p.nama}
              </Badge>
            ))}
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-primary font-medium leading-relaxed">
            Konten akan segera diposting ke platform eksternal yang terhubung.
            Tindakan ini tidak dapat dibatalkan setelah proses pengiriman dimulai.
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-3.5" />
            )}
            Publish Sekarang
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
