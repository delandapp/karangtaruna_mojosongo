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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/ui/combobox";
import {
  schemaHubungkanAkun,
  FormHubungkanAkun,
} from "@/lib/validations/sosial-media.schema";
import {
  useGetDaftarPlatformQuery,
  useHubungkanAkunMutation,
} from "@/features/api/sosialMediaApi";

interface ModalHubungkanAkunProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModalHubungkanAkun({
  isOpen,
  onOpenChange,
  onSuccess,
}: ModalHubungkanAkunProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: platformResponse, isLoading: isLoadingPlatforms } =
    useGetDaftarPlatformQuery();
  const [hubungkanAkun] = useHubungkanAkunMutation();

  const platforms = platformResponse?.data || [];

  const form = useForm<FormHubungkanAkun>({
    resolver: zodResolver(schemaHubungkanAkun) as any,
    defaultValues: {
      platform_id: undefined as any,
      nama_akun: "",
      username: "",
      access_token: "",
      refresh_token: "",
      token_expires_at: "",
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        platform_id: undefined as any,
        nama_akun: "",
        username: "",
        access_token: "",
        refresh_token: "",
        token_expires_at: "",
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (values: FormHubungkanAkun) => {
    setIsSubmitting(true);
    try {
      // Clean up optional fields if empty
      const payload = {
        ...values,
        refresh_token: values.refresh_token || undefined,
        token_expires_at: values.token_expires_at
          ? new Date(values.token_expires_at).toISOString()
          : undefined,
      };

      await hubungkanAkun(payload).unwrap();
      toast.success("✅ Akun berhasil dihubungkan");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gagal menghubungkan akun", {
        description: error?.data?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold">
            🔗 Hubungkan Akun Baru
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Hubungkan akun sosial media Anda untuk mengelola konten dan pesan dalam satu dashboard.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ── Platform ── */}
            <FormField
              control={form.control}
              name="platform_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Platform <span className="text-destructive">*</span></FormLabel>
                  <ComboBox
                    title="Platform"
                    data={platforms}
                    selected={field.value}
                    onChange={(val: any) => {
                      field.onChange(val ? val.id : undefined);
                    }}
                    valueKey="id"
                    labelKey="nama"
                    disabled={isLoadingPlatforms}
                    disabledText="Memuat platform..."
                  />
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Nama Akun ── */}
            <FormField
              control={form.control}
              name="nama_akun"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Tampilan Akun <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Humas Karang Taruna"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Username ── */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username / ID Akun <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: kt_mojosongo"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Access Token ── */}
            <FormField
              control={form.control}
              name="access_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan access token platform"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Refresh Token ── */}
            <FormField
              control={form.control}
              name="refresh_token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh Token <span className="text-muted-foreground text-xs">(Opsional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Masukkan refresh token jika ada"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── Token Expired At ── */}
            <FormField
              control={form.control}
              name="token_expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Kedaluwarsa Pada <span className="text-muted-foreground text-xs">(Opsional)</span></FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
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
                Hubungkan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
