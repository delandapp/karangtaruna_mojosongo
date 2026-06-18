"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
import { HubungkanAkunPayload } from "@/lib/types/sosial-media.types";

interface ModalHubungkanAkunProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newAccountId?: number, method?: "qr" | "pairing") => void;
  platformSlug?: string;
}

// Helper: determine if platform uses simple credential login (username + password)
const isCredentialBased = (slug?: string) => {
  if (!slug) return false;
  return ["facebook", "instagram", "tiktok", "twitter"].includes(
    slug.toLowerCase()
  );
};

// Platform-specific field labels and placeholders
const getFieldConfig = (slug?: string) => {
  const s = slug?.toLowerCase();
  switch (s) {
    case "facebook":
      return {
        usernameLabel: "Email atau Nomor Telepon",
        usernamePlaceholder: "Contoh: humas@karangtaruna.id",
        passwordLabel: "Password",
        passwordPlaceholder: "Masukkan password Facebook Anda",
      };
    case "instagram":
      return {
        usernameLabel: "Username Instagram",
        usernamePlaceholder: "Contoh: kt_mojosongo",
        passwordLabel: "Password",
        passwordPlaceholder: "Masukkan password Instagram Anda",
      };
    case "tiktok":
      return {
        usernameLabel: "Username TikTok",
        usernamePlaceholder: "Contoh: @kt_mojosongo",
        passwordLabel: "Password",
        passwordPlaceholder: "Masukkan password TikTok Anda",
      };
    case "twitter":
      return {
        usernameLabel: "Username Twitter / X",
        usernamePlaceholder: "Contoh: @kt_mojosongo",
        passwordLabel: "Password",
        passwordPlaceholder: "Masukkan password Twitter/X Anda",
      };
    case "whatsapp":
      return {
        usernameLabel: "Nomor WhatsApp (dengan Kode Negara)",
        usernamePlaceholder: "Contoh: 6289512345678",
        passwordLabel: "Password / Token",
        passwordPlaceholder: "Tidak diperlukan",
      };
    default:
      return {
        usernameLabel: "Username / ID Akun",
        usernamePlaceholder: "Contoh: kt_mojosongo",
        passwordLabel: "Access Token",
        passwordPlaceholder: "Masukkan access token platform",
      };
  }
};

export function ModalHubungkanAkun({
  isOpen,
  onOpenChange,
  onSuccess,
  platformSlug,
}: ModalHubungkanAkunProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "cookie">("cookie");
  const [waMethod, setWaMethod] = useState<"qr" | "pairing">("qr");
  const { data: platformResponse, isLoading: isLoadingPlatforms } =
    useGetDaftarPlatformQuery();
  const [hubungkanAkun] = useHubungkanAkunMutation();

  const platforms = platformResponse?.data || [];

  // Find the current platform based on slug (for auto-selecting)
  const currentPlatform = platformSlug
    ? platforms.find(
        (p) => p.slug?.toLowerCase() === platformSlug.toLowerCase()
      )
    : null;

  const useCredential = isCredentialBased(platformSlug);
  const isInstagram = platformSlug?.toLowerCase() === "instagram";
  const isWhatsapp = platformSlug?.toLowerCase() === "whatsapp";
  const fieldConfig = getFieldConfig(platformSlug);

  const form = useForm<FormHubungkanAkun>({
    resolver: zodResolver(schemaHubungkanAkun) as any,
    defaultValues: {
      platform_id: undefined as any,
      nama_akun: "",
      username: "",
      access_token: "",
      session_id: "",
      refresh_token: "",
      token_expires_at: "",
    },
  });

  // Reset form when modal opens/closes, auto-select platform if slug provided
  useEffect(() => {
    if (isOpen) {
      form.reset({
        platform_id: currentPlatform?.id ?? (undefined as any),
        nama_akun: "",
        username: "",
        access_token: "",
        session_id: "",
        refresh_token: "",
        token_expires_at: "",
      });
      setShowPassword(false);
      setLoginMethod("cookie");
      setWaMethod("qr");
    }
  }, [isOpen, form, currentPlatform]);

  const onSubmit = async (values: FormHubungkanAkun) => {
    if (isInstagram) {
      if (loginMethod === "cookie" && !values.session_id?.trim()) {
        form.setError("session_id", {
          type: "manual",
          message: "Instagram Session ID cookie wajib diisi",
        });
        return;
      }
      if (loginMethod === "password" && !values.access_token?.trim()) {
        form.setError("access_token", {
          type: "manual",
          message: "Password Instagram wajib diisi",
        });
        return;
      }
    } else if (isWhatsapp) {
      const cleanPhone = values.username.replace(/[^\d]/g, "");
      if (!cleanPhone) {
        form.setError("username", {
          type: "manual",
          message: "Nomor WhatsApp tidak valid (harus mengandung angka kode negara, contoh: 62895...)",
        });
        return;
      }
    } else if (useCredential || !values.access_token?.trim()) {
      if (!values.access_token?.trim()) {
        form.setError("access_token", {
          type: "manual",
          message: `${fieldConfig.passwordLabel} wajib diisi`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Clean up optional fields if empty
      const payload: HubungkanAkunPayload = {
        platform_id: values.platform_id,
        nama_akun: values.nama_akun,
        username: values.username,
        access_token: (isInstagram && loginMethod === "cookie" ? "" : values.access_token) || "",
        session_id: isInstagram && loginMethod === "cookie" ? values.session_id : undefined,
        refresh_token: values.refresh_token || undefined,
        token_expires_at: values.token_expires_at
          ? new Date(values.token_expires_at).toISOString()
          : undefined,
      };

      const result = await hubungkanAkun(payload).unwrap();
      toast.success("✅ Akun berhasil dihubungkan — Memulai sinkronisasi...");
      onOpenChange(false);
      // Pass new account ID so LoginPage can handle sync with proper loading state
      onSuccess(result?.data?.id, isWhatsapp ? waMethod : undefined);
    } catch (error: any) {
      const errorMsg = error?.data?.error?.message || error?.data?.message || "Terjadi kesalahan pada sistem";
      toast.error("Gagal menghubungkan akun", {
        description: errorMsg,
        duration: 10000,
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
            {isInstagram
              ? "Gunakan metode Cookie Session ID untuk menghubungkan Instagram dengan andal tanpa diblokir verifikasi keamanan."
              : useCredential
              ? `Masukkan username dan password ${currentPlatform?.nama || ""} Anda untuk menghubungkan akun.`
              : "Hubungkan akun sosial media Anda untuk mengelola konten dan pesan dalam satu dashboard."}
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
                  <FormLabel>
                    Platform <span className="text-destructive">*</span>
                  </FormLabel>
                  <ComboBox
                    title="Platform"
                    data={platforms}
                    selected={platforms.find((p) => p.id === field.value) ?? null}
                    onChange={(val: any) => {
                      field.onChange(val ? val.id : undefined);
                    }}
                    valueKey="id"
                    labelKey="nama"
                    disabled={isLoadingPlatforms || !!currentPlatform}
                    disabledText={
                      isLoadingPlatforms
                        ? "Memuat platform..."
                        : currentPlatform?.nama ?? "Memuat platform..."
                    }
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
                  <FormLabel>
                    Nama Tampilan Akun{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
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
                  <FormLabel>
                    {fieldConfig.usernameLabel}{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={fieldConfig.usernamePlaceholder}
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* ── WhatsApp Connection Method Toggle ── */}
            {isWhatsapp && (
              <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-emerald-500/5 dark:bg-emerald-500/10">
                <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Metode Koneksi WhatsApp
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWaMethod("qr")}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                      waMethod === "qr"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/50"
                    }`}
                  >
                    Scan QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaMethod("pairing")}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                      waMethod === "pairing"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/50"
                    }`}
                  >
                    Pairing Code (No. HP)
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                  {waMethod === "qr" 
                    ? "Gunakan scanner pada WhatsApp HP Anda untuk memindai QR Code."
                    : "Sistem akan menampilkan 8-karakter kode pairing yang bisa Anda masukkan di WhatsApp HP Anda."}
                </p>
              </div>
            )}

            {/* ── Instagram Auth Method Toggle ── */}
            {isInstagram && (
              <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-muted/20">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Metode Autentikasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("cookie");
                      form.setValue("access_token", "");
                      form.clearErrors("access_token");
                    }}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                      loginMethod === "cookie"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/50"
                    }`}
                  >
                    Session ID Cookie (Rekomendasi)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("password");
                      form.setValue("session_id", "");
                      form.clearErrors("session_id");
                    }}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium border transition-all ${
                      loginMethod === "password"
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/50"
                    }`}
                  >
                    Password Akun
                  </button>
                </div>
              </div>
            )}

            {/* ── Instagram Session ID Field ── */}
            {isInstagram && loginMethod === "cookie" && (
              <FormField
                control={form.control}
                name="session_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Instagram Cookie / Session ID <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Salin sessionid saja ATAU tempel seluruh Cookie header"
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50 font-mono text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                    <div className="text-[11px] leading-relaxed text-muted-foreground bg-muted/40 border border-border/40 rounded-lg p-3 space-y-2.5 mt-1.5">
                      <div>
                        <p className="font-semibold text-foreground">Metode 1: Salin Seluruh Cookie Header (Sangat Direkomendasikan jika gagal):</p>
                        <ol className="list-decimal pl-4 space-y-1 mt-1">
                          <li>Buka <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">instagram.com</a> di PC/Laptop Anda (pastikan sudah login).</li>
                          <li>Tekan <kbd className="px-1 py-0.5 bg-muted-foreground/15 border border-muted-foreground/30 rounded text-[9px]">F12</kbd>, lalu pilih tab <strong className="text-foreground">Network</strong> (Jaringan).</li>
                          <li>Muat ulang (refresh) halaman Instagram.</li>
                          <li>Klik request pertama di daftar, lalu di tab <strong className="text-foreground">Headers</strong>, scroll ke bawah ke bagian <strong className="text-foreground">Request Headers</strong>.</li>
                          <li>Cari header bernama <strong className="text-foreground">cookie</strong>, salin seluruh nilainya (berisi `mid=...; sessionid=...`), lalu tempelkan di kolom atas.</li>
                        </ol>
                      </div>
                      <div className="border-t border-border/40 pt-2">
                        <p className="font-semibold text-foreground">Metode 2: Hanya Session ID:</p>
                        <ol className="list-decimal pl-4 space-y-1 mt-1">
                          <li>Buka tab <strong className="text-foreground">Application</strong> (Chrome/Edge) atau <strong className="text-foreground">Storage</strong> (Firefox) di F12.</li>
                          <li>Buka <strong className="text-foreground">Cookies</strong> → <strong className="text-foreground">https://www.instagram.com</strong>.</li>
                          <li>Salin nilai dari cookie <strong className="text-foreground">sessionid</strong>, lalu tempelkan di kolom atas.</li>
                        </ol>
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* ── Password / Access Token ── */}
            {(!isInstagram || loginMethod === "password") && (
              <FormField
                control={form.control}
                name="access_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fieldConfig.passwordLabel}{" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={
                            useCredential
                              ? showPassword
                                ? "text"
                                : "password"
                              : "text"
                          }
                          placeholder={fieldConfig.passwordPlaceholder}
                          {...field}
                          className="bg-muted/50 focus-visible:ring-primary/50 pr-10"
                        />
                        {useCredential && (
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            {/* ── Refresh Token — Only for non-credential platforms ── */}
            {!useCredential && (
              <FormField
                control={form.control}
                name="refresh_token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Refresh Token{" "}
                      <span className="text-muted-foreground text-xs">
                        (Opsional)
                      </span>
                    </FormLabel>
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
            )}

            {/* ── Token Expired At — Only for non-credential platforms ── */}
            {!useCredential && (
              <FormField
                control={form.control}
                name="token_expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Token Kedaluwarsa Pada{" "}
                      <span className="text-muted-foreground text-xs">
                        (Opsional)
                      </span>
                    </FormLabel>
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
            )}

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
                {isSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {useCredential ? "Login & Hubungkan" : "Hubungkan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
