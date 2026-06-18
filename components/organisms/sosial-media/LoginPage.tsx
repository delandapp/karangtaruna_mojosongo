"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Link2, RefreshCw, Trash2, Plus } from "lucide-react";
import {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  usePerbaruiTokenMutation,
  useSinkronisasiAkunMutation,
} from "@/features/api/sosialMediaApi";
import { ModalHubungkanAkun } from "../modals/sosial-media/login/ModalHubungkanAkun";
import { ModalPutuskanAkun } from "../modals/sosial-media/login/ModalPutuskanAkun";
import { PlatformGuide } from "./PlatformGuide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface LoginPageProps {
  platformSlug: string;
}

export function LoginPage({ platformSlug }: LoginPageProps) {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [isUpdateTokenOpen, setIsUpdateTokenOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [newToken, setNewToken] = useState("");
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);

  // Fetch all platforms to get current platform ID by slug
  const { data: platformResponse, isLoading: isLoadingPlatform } = useGetDaftarPlatformQuery();
  const [perbaruiToken] = usePerbaruiTokenMutation();

  const currentPlatform = platformResponse?.data?.find(
    (p) => p.slug.toLowerCase() === platformSlug.toLowerCase()
  );

  // Fetch accounts connected to this platform
  const {
    data: accountsResponse,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useGetAkunByPlatformQuery(currentPlatform?.id || 0, {
    skip: !currentPlatform?.id,
  });

  const accounts = accountsResponse?.data || [];

  // Sync and polling states
  const [sinkronisasiAkun] = useSinkronisasiAkunMutation();
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null);
  const [whatsappPairingCode, setWhatsappPairingCode] = useState<string | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<number | null>(null);

  // WhatsApp connection polling — polls every 3 seconds while QR dialog is open
  useEffect(() => {
    let intervalId: any;
    if (isQrDialogOpen && syncingAccountId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/sosial-media/akun/${syncingAccountId}/qr`);
          const data = await res.json();
          if (data.success) {
            const { status, qrCode, pairingCode } = data.data;
            if (status === "connected") {
              toast.success("✅ WhatsApp Web berhasil terhubung!");
              setIsQrDialogOpen(false);
              setWhatsappQr(null);
              setWhatsappPairingCode(null);
              setSyncingAccountId(null);
              setIsSyncing(false);
              refetchAccounts();
            } else if (status === "qr_ready") {
              if (pairingCode) {
                setWhatsappPairingCode(pairingCode);
                setWhatsappQr(null);
              } else if (qrCode) {
                setWhatsappQr(qrCode);
                setWhatsappPairingCode(null);
              }
            } else if (status === "disconnected") {
              toast.error("Gagal menghubungkan WhatsApp Web");
              setIsQrDialogOpen(false);
              setWhatsappQr(null);
              setWhatsappPairingCode(null);
              setSyncingAccountId(null);
              setIsSyncing(false);
            }
          }
        } catch (err) {
          console.error("Error polling WhatsApp QR:", err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isQrDialogOpen, syncingAccountId, refetchAccounts]);

  const handleSyncAccount = async (account: any, method: "qr" | "pairing" = "qr") => {
    if (isSyncing) return;
    setIsSyncing(true);
    setWhatsappQr(null);
    setWhatsappPairingCode(null);
    setSyncingAccountId(null);

    const toastId = toast.loading(`⏳ Mensinkronisasi data ${account.nama_akun}...`);
    let needsQr = false;

    try {
      const response = await sinkronisasiAkun(
        platformSlug.toLowerCase() === "whatsapp" 
          ? { id: account.id, method } 
          : account.id
      ).unwrap();
      
      if (response.success && response.data?.status === "need_qr") {
        needsQr = true;
        if (response.data.pairingCode) {
          setWhatsappPairingCode(response.data.pairingCode);
          setWhatsappQr(null);
        } else {
          setWhatsappQr(response.data.qrCode);
          setWhatsappPairingCode(null);
        }
        setSyncingAccountId(account.id);
        setIsQrDialogOpen(true);
        toast.info(response.data.pairingCode 
          ? "📱 Silakan masukkan pairing code pada WhatsApp HP Anda" 
          : "📱 Silakan scan QR Code untuk WhatsApp Web", { id: toastId });
        // isSyncing stays true — reset only when QR is resolved (in polling effect)
      } else {
        toast.success(response.data?.message || "✅ Sinkronisasi berhasil!", { id: toastId });
        refetchAccounts();
      }
    } catch (error: any) {
      const errorMsg = error?.data?.error?.message || error?.data?.message || "Terjadi kesalahan pada sistem";
      toast.error("Gagal sinkronisasi data", {
        id: toastId,
        description: errorMsg,
        duration: 10000,
      });
    } finally {
      // Only reset isSyncing if NOT waiting for QR scan
      if (!needsQr) {
        setIsSyncing(false);
      }
    }
  };

  // Called by ModalHubungkanAkun after successfully connecting a new account
  const handleConnectSuccess = async (newAccountId?: number, method?: "qr" | "pairing") => {
    await refetchAccounts();
    if (newAccountId) {
      // Give DB a moment to settle then auto-sync the new account
      setTimeout(async () => {
        // Build minimal account object needed by handleSyncAccount
        const freshAccounts = await refetchAccounts();
        const newAcc = (freshAccounts as any)?.data?.data?.find((a: any) => a.id === newAccountId);
        if (newAcc) {
          handleSyncAccount(newAcc, method);
        }
      }, 800);
    }
  };

  // Theme matching per platform slug
  const getThemeStyles = () => {
    switch (platformSlug.toLowerCase()) {
      case "facebook":
        return {
          bg: "from-blue-600/10 to-blue-500/5",
          border: "border-blue-500/20",
          text: "text-blue-600 dark:text-blue-400",
          button: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      case "instagram":
        return {
          bg: "from-pink-600/10 via-purple-600/5 to-orange-500/5",
          border: "border-pink-500/20",
          text: "text-pink-600 dark:text-pink-400",
          button: "bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 hover:opacity-95 text-white",
        };
      case "tiktok":
        return {
          bg: "from-zinc-900/15 to-red-500/5",
          border: "border-zinc-500/20",
          text: "text-rose-500 dark:text-rose-400",
          button: "bg-black hover:bg-zinc-900 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black",
        };
      case "whatsapp":
        return {
          bg: "from-emerald-600/10 to-emerald-500/5",
          border: "border-emerald-500/20",
          text: "text-emerald-600 dark:text-emerald-400",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "twitter":
        return {
          bg: "from-sky-500/10 to-sky-400/5",
          border: "border-sky-500/20",
          text: "text-sky-500 dark:text-sky-400",
          button: "bg-sky-500 hover:bg-sky-600 text-white",
        };
      default:
        return {
          bg: "from-primary/10 to-primary/5",
          border: "border-primary/20",
          text: "text-primary",
          button: "bg-primary hover:bg-primary/95 text-primary-foreground",
        };
    }
  };

  const styles = getThemeStyles();

  const handleOpenDisconnect = (account: any) => {
    setSelectedAccount(account);
    setIsDisconnectOpen(true);
  };

  const handleOpenUpdateToken = (account: any) => {
    setSelectedAccount(account);
    setNewToken("");
    setIsUpdateTokenOpen(true);
  };

  const handleUpdateTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim() || isUpdatingToken) return;

    setIsUpdatingToken(true);
    try {
      await perbaruiToken({
        id: selectedAccount.id,
        body: { access_token: newToken.trim() },
      }).unwrap();
      toast.success("✅ Token berhasil diperbarui");
      refetchAccounts();
      setIsUpdateTokenOpen(false);
    } catch (error: any) {
      const errorMsg = error?.data?.error?.message || error?.data?.message || "Terjadi kesalahan pada sistem";
      toast.error("Gagal memperbarui token", {
        description: errorMsg,
        duration: 10000,
      });
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "terhubung":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full font-medium">
            ● Terhubung
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="rounded-full font-medium">
            ● Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 rounded-full font-medium">
            ● Terputus
          </Badge>
        );
    }
  };

  if (isLoadingPlatform) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!currentPlatform) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-muted/10 border rounded-2xl">
        Platform "{platformSlug}" tidak didukung atau belum diaktifkan dalam database.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Header Card */}
      <Card className={`border ${styles.border} bg-gradient-to-br ${styles.bg} overflow-hidden shadow-xs rounded-2xl`}>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold capitalize ${styles.text}`}>
                {currentPlatform.nama}
              </span>
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-xs text-[10px]">
                API Integrasi
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground text-sm max-w-lg leading-relaxed">
              Hubungkan akun {currentPlatform.nama} Anda untuk mensinkronisasi inbox obrolan, melacak statistik
              performa postingan, dan menjadwalkan konten publikasi Anda secara otomatis.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsConnectOpen(true)}
            className={`shadow-md rounded-xl font-semibold shrink-0 gap-2 ${styles.button}`}
          >
            <Plus className="size-4" />
            Hubungkan Akun
          </Button>
        </CardHeader>
      </Card>

      {/* Platform Guide - Step by step token instructions */}
      <PlatformGuide platformSlug={platformSlug} />

      {/* Connected Accounts Table */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/40">
          <CardTitle className="text-base font-semibold">
            🔗 Akun Terhubung ({accounts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar kredensial akun sosial media yang saat ini aktif di sistem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <Link2 className="size-10 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Belum ada akun terhubung</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Silakan hubungkan akun {currentPlatform.nama} baru Anda dengan mengklik tombol di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs py-3 px-6">Nama Tampilan</TableHead>
                    <TableHead className="font-semibold text-xs py-3 px-6">Username / ID</TableHead>
                    <TableHead className="font-semibold text-xs py-3 px-6">Status</TableHead>
                    <TableHead className="font-semibold text-xs py-3 px-6">Token Expired</TableHead>
                    <TableHead className="font-semibold text-xs py-3 px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-muted/10">
                      <TableCell className="font-medium text-sm py-4 px-6">{acc.nama_akun}</TableCell>
                      <TableCell className="text-muted-foreground text-sm py-4 px-6">@{acc.username}</TableCell>
                      <TableCell className="py-4 px-6">{getStatusBadge(acc.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs py-4 px-6">
                        {acc.token_expires_at
                          ? new Date(acc.token_expires_at).toLocaleDateString("id-ID", {
                              dateStyle: "medium",
                            })
                          : "Tidak terbatas"}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncAccount(acc)}
                            disabled={isSyncing}
                            className="h-8 text-xs rounded-lg gap-1.5 text-primary border-primary/20 hover:bg-primary/5"
                          >
                            <RefreshCw className={`size-3.5 ${isSyncing && syncingAccountId === acc.id ? "animate-spin" : ""}`} />
                            {isSyncing && syncingAccountId === acc.id ? "Sinkronisasi..." : "Sinkronisasi"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenUpdateToken(acc)}
                            className="h-8 text-xs rounded-lg gap-1.5"
                          >
                            <RefreshCw className="size-3.5" />
                            Perbarui Token
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDisconnect(acc)}
                            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border/50 rounded-lg gap-1.5"
                          >
                            <Trash2 className="size-3.5" />
                            Putuskan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ModalHubungkanAkun
        isOpen={isConnectOpen}
        onOpenChange={setIsConnectOpen}
        onSuccess={handleConnectSuccess}
        platformSlug={platformSlug}
      />

      {selectedAccount && (
        <ModalPutuskanAkun
          isOpen={isDisconnectOpen}
          onOpenChange={setIsDisconnectOpen}
          akunId={selectedAccount.id}
          namaAkun={selectedAccount.nama_akun}
          platformNama={currentPlatform.nama}
          onSuccess={refetchAccounts}
        />
      )}

      {/* Inline Modal Update Token */}
      <Dialog open={isUpdateTokenOpen} onOpenChange={setIsUpdateTokenOpen}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold">
              🔑 Perbarui Token Akun
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Masukkan token akses baru untuk akun <strong>{selectedAccount?.nama_akun}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Access Token Baru</label>
              <Input
                placeholder="Masukkan access token baru"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="bg-muted/50 focus-visible:ring-primary/50"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateTokenOpen(false)}
                disabled={isUpdatingToken}
                className="bg-transparent border-border/50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!newToken.trim() || isUpdatingToken}
                className={`shadow-lg font-semibold ${styles.button}`}
              >
                {isUpdatingToken && <Loader2 className="mr-2 size-4 animate-spin" />}
                Perbarui
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal QR Code & Pairing Code WhatsApp */}
      <Dialog open={isQrDialogOpen} onOpenChange={(open) => {
        setIsQrDialogOpen(open);
        if (!open) {
          setWhatsappQr(null);
          setWhatsappPairingCode(null);
          setIsSyncing(false);
        }
      }}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl p-6 text-center">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold flex items-center justify-center gap-2">
              {whatsappPairingCode ? "📱 Tautkan dengan Kode Pairing" : "📱 Pindai QR Code WhatsApp"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              {whatsappPairingCode ? (
                <>
                  Buka WhatsApp di ponsel Anda → pilih <strong className="text-foreground">Perangkat Tertaut</strong> → ketuk <strong className="text-foreground font-semibold">Tautkan Perangkat</strong> → ketuk <strong className="text-foreground font-semibold">Tautkan dengan nomor telepon saja</strong> di bagian bawah, lalu masukkan 8-digit kode berikut:
                </>
              ) : (
                <>
                  Buka aplikasi WhatsApp di ponsel Anda, pilih <strong>Perangkat Tertaut</strong>, lalu scan QR Code berikut untuk menghubungkan akun <strong>{accounts.find(a => a.id === syncingAccountId)?.nama_akun || "WhatsApp"}</strong>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 bg-white rounded-xl border p-4 shadow-inner my-2">
            {whatsappPairingCode ? (
              <div className="flex flex-col items-center justify-center py-4 px-6 gap-3">
                <span className="text-4xl font-extrabold tracking-widest text-emerald-600 font-mono select-all select-none bg-emerald-50 px-6 py-3.5 border border-emerald-200 rounded-2xl shadow-sm">
                  {whatsappPairingCode.substring(0, 4)}-{whatsappPairingCode.substring(4)}
                </span>
                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
                  Kode Pairing WhatsApp
                </span>
              </div>
            ) : whatsappQr ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(whatsappQr)}`}
                alt="WhatsApp QR Code"
                className="w-[220px] h-[220px] object-contain transition-all"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[220px] w-[220px]">
                <Loader2 className="size-8 text-emerald-500 animate-spin mb-2" />
                <span className="text-xs text-muted-foreground text-zinc-600">Menunggu respons dari server...</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground text-left">
            <p>● Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
              {whatsappPairingCode ? "Menunggu input kode di HP..." : whatsappQr ? "Menunggu scan..." : "Menyiapkan..."}
            </span></p>
            <p>● Halaman ini akan otomatis menutup setelah tautan berhasil terhubung.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
