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
import { usePutuskanAkunMutation } from "@/features/api/sosialMediaApi";

interface ModalPutuskanAkunProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  akunId: number;
  namaAkun: string;
  platformNama: string;
}

export function ModalPutuskanAkun({
  isOpen,
  onOpenChange,
  onSuccess,
  akunId,
  namaAkun,
  platformNama,
}: ModalPutuskanAkunProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [putuskanAkun] = usePutuskanAkunMutation();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await putuskanAkun(akunId).unwrap();
      toast.success(`✅ Berhasil memutuskan akun ${namaAkun}`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal memutuskan akun", {
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
          <DialogTitle className="text-xl font-semibold text-destructive">
            ⚠️ Putuskan Koneksi Akun
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-2">
            Apakah Anda yakin ingin memutuskan koneksi akun{" "}
            <strong>
              {namaAkun} ({platformNama})
            </strong>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-destructive font-medium leading-relaxed">
            Tindakan ini akan menghentikan sinkronisasi pesan masuk, statistik analitik,
            dan kemampuan untuk mempublikasikan konten langsung dari dashboard untuk akun ini.
            Data historis akan tetap disimpan tetapi tidak akan diperbarui lagi.
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
            Putuskan Akun
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
