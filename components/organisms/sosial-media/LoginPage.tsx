"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Link2, RefreshCw, Trash2, Plus } from "lucide-react";
import {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  usePerbaruiTokenMutation,
} from "@/features/api/sosialMediaApi";
import { ModalHubungkanAkun } from "../modals/sosial-media/login/ModalHubungkanAkun";
import { ModalPutuskanAkun } from "../modals/sosial-media/login/ModalPutuskanAkun";
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
      toast.error("Gagal memperbarui token", {
        description: error?.data?.message || "Terjadi kesalahan pada sistem",
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
        onSuccess={refetchAccounts}
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
    </div>
  );
}
