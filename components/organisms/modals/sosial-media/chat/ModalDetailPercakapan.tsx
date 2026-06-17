"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useGetChatByIdQuery,
  useBalasChatMutation,
} from "@/features/api/sosialMediaApi";

interface ModalDetailPercakapanProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: number;
}

export function ModalDetailPercakapan({
  isOpen,
  onOpenChange,
  chatId,
}: ModalDetailPercakapanProps) {
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch chat details by ID. This GET request will automatically mark it as read.
  const {
    data: chatResponse,
    isLoading,
    refetch,
  } = useGetChatByIdQuery(chatId, {
    skip: !isOpen || !chatId,
  });

  const [balasChat] = useBalasChatMutation();

  const chat = chatResponse?.data;
  const platformName = chat?.akun?.platform?.nama || "";
  const senderNama = chat?.sender_nama || "";
  const replies = chat?.balasan || [];

  // Scroll to bottom on load/update
  useEffect(() => {
    if (isOpen && !isLoading) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, isLoading, replies.length]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await balasChat({
        chat_id: chatId,
        isi_balasan: replyText.trim(),
      }).unwrap();

      setReplyText("");
      toast.success("✅ Balasan berhasil dikirim");
      refetch(); // Reload chat list to show the new reply
    } catch (error: any) {
      toast.error("Gagal mengirim balasan", {
        description: error?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: localeId,
      });
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold truncate max-w-[280px]">
              💬 Percakapan dengan {senderNama}
            </DialogTitle>
            {platformName && (
              <Badge variant="outline" className="text-xs bg-primary/5 capitalize text-primary border-primary/20">
                {platformName}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            Hubungi pengirim pesan langsung dari inbox portal sosial media.
          </DialogDescription>
        </DialogHeader>

        {/* Conversation Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="size-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">Memuat percakapan...</p>
            </div>
          ) : chat ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 1. Original Sender Message */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div className="bg-card border border-border/60 text-foreground px-4 py-3 rounded-2xl rounded-tl-none shadow-xs">
                    <p className="text-xs font-semibold text-primary mb-1">{senderNama}</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.pesan}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 ml-1">
                    {formatTime(chat.dibuat_pada)}
                  </span>
                </div>

                {/* 2. Replied Messages */}
                {replies.map((reply) => (
                  <div key={reply.id} className="flex flex-col items-end max-w-[85%] ml-auto">
                    <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-none shadow-xs">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.isi_balasan}</p>
                      {!reply.berhasil && (
                        <span className="text-[10px] text-destructive-foreground underline block mt-1 font-semibold">
                          ⚠️ Gagal Terkirim ke Platform
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 mr-1">
                      {formatTime(reply.dibuat_pada)}
                    </span>
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
              Percakapan tidak ditemukan atau sudah dihapus.
            </div>
          )}
        </div>

        {/* Input Bar */}
        {!isLoading && chat && (
          <form
            onSubmit={handleSendReply}
            className="p-4 border-t border-border/40 flex items-center gap-2 bg-card shrink-0"
          >
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Tulis balasan untuk ${senderNama}...`}
              className="flex-1 bg-muted/40 focus-visible:ring-primary/50"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!replyText.trim() || isSubmitting}
              className="rounded-xl shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
