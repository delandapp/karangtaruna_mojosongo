"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  schemaBalasChat,
  FormBalasChat,
} from "@/lib/validations/sosial-media.schema";
import { useBalasChatMutation } from "@/features/api/sosialMediaApi";

interface ModalBalasChatProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  chatId: number;
  senderNama: string;
  pesanAsli: string;
}

export function ModalBalasChat({
  isOpen,
  onOpenChange,
  onSuccess,
  chatId,
  senderNama,
  pesanAsli,
}: ModalBalasChatProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balasChat] = useBalasChatMutation();

  const form = useForm<FormBalasChat>({
    resolver: zodResolver(schemaBalasChat) as any,
    defaultValues: {
      chat_id: chatId,
      isi_balasan: "",
    },
  });

  // Set chat_id when prop changes and reset form on open
  useEffect(() => {
    if (isOpen) {
      form.reset({
        chat_id: chatId,
        isi_balasan: "",
      });
    }
  }, [isOpen, chatId, form]);

  const onSubmit = async (values: FormBalasChat) => {
    setIsSubmitting(true);
    try {
      await balasChat(values).unwrap();
      toast.success("✅ Balasan berhasil dikirim");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal mengirim balasan", {
        description: error?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">
            💬 Kirim Balasan
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Kirim pesan balasan langsung ke pengirim pesan platform sosial media.
          </DialogDescription>
        </DialogHeader>

        {/* Konteks Pesan Asli */}
        <div className="bg-muted/40 border border-border/60 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-foreground mb-1">
            Pesan dari {senderNama}:
          </p>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            "{pesanAsli}"
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="isi_balasan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pesan Balasan <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Tulis balasan pesan Anda di sini..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50 resize-none rounded-xl"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

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
                type="submit"
                disabled={isSubmitting}
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Kirim Balasan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
