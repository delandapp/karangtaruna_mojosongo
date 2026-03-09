"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HakAksesFormModal } from "../modals/HakAksesFormModal";
import {
  useGetHakAksesQuery,
  useDeleteHakAksesMutation,
} from "@/features/api/hakAksesApi";

interface RuleData {
  level?: { nama_level: string };
  jabatan?: { nama_jabatan: string };
}

interface HakAksesData {
  id: number;
  nama_fitur: string;
  tipe_fitur: string;
  endpoint: string;
  method: string;
  is_all_level: boolean;
  is_all_jabatan: boolean;
  rules: RuleData[];
}

export function HakAksesTable() {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHakAkses, setEditingHakAkses] = useState<HakAksesData | null>(
    null,
  );

  const {
    data: hakAksesRes,
    isFetching: loading,
    refetch,
  } = useGetHakAksesQuery({
    page,
    limit,
    search: searchQuery || undefined,
  });

  const hakAksesList = hakAksesRes?.data || [];
  const total = hakAksesRes?.meta?.totalPages || 0;

  const fetchHakAkses = () => {
    refetch();
  };

  const [deleteHakAkses] = useDeleteHakAksesMutation();

  const handleDelete = async (id: number, fitur: string, method: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus hak akses [${method}] ${fitur}?`,
      )
    )
      return;

    try {
      await deleteHakAkses(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Data hak akses ${fitur} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description:
          error?.data?.error?.message ||
          "Kesalahan jaringan saat menghapus data.",
      });
    }
  };

  const handleEdit = (data: HakAksesData) => {
    setEditingHakAkses(data);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingHakAkses(null);
    setIsModalOpen(true);
  };

  const onFormSuccess = () => {
    setIsModalOpen(false);
    fetchHakAkses();
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "POST":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PUT":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari fitur atau endpoint..."
              className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e: any) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchHakAkses()}
            disabled={loading}
            className="shrink-0 bg-card/50 backdrop-blur"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin text-muted-foreground" : "text-foreground"}`}
            />
          </Button>
          <Button
            onClick={handleCreate}
            className="shrink-0 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
          >
            <Plus className="mr-2 size-4" />
            Tambah Hak Akses
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[200px] text-foreground font-semibold">
                Nama Fitur
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Method
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Endpoint / Base API
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Akses Level
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Akses Jabatan
              </TableHead>
              <TableHead className="text-right text-foreground font-semibold">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                    <span>Memuat data hak akses...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : hakAksesList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              hakAksesList.map((item: HakAksesData) => (
                <TableRow
                  key={item.id}
                  className="group transition-colors hover:bg-muted/40 border-border/40"
                >
                  <TableCell className="font-medium text-foreground">
                    {item.nama_fitur}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${getMethodBadgeClass(item.method)}`}
                    >
                      {item.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">
                    {item.endpoint}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.is_all_level ? (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Semua Level
                        </Badge>
                      ) : item.rules &&
                        item.rules.filter((r) => r.level).length > 0 ? (
                        Array.from(
                          new Set(
                            item.rules
                              .filter((r) => r.level)
                              .map((r) => r.level?.nama_level),
                          ),
                        ).map((levelName) => (
                          <Badge
                            key={levelName}
                            variant="secondary"
                            className="bg-muted text-muted-foreground"
                          >
                            {levelName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.is_all_jabatan ? (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Semua Jabatan
                        </Badge>
                      ) : item.rules &&
                        item.rules.filter((r) => r.jabatan).length > 0 ? (
                        Array.from(
                          new Set(
                            item.rules
                              .filter((r) => r.jabatan)
                              .map((r) => r.jabatan?.nama_jabatan),
                          ),
                        ).map((jabatanName) => (
                          <Badge
                            key={jabatanName}
                            variant="outline"
                            className="bg-background text-foreground"
                          >
                            {jabatanName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-8 p-0 text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                        >
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] border-border/50 bg-card/80 backdrop-blur-xl"
                      >
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Aksi Data
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                          onClick={() => handleEdit(item)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 size-4 text-primary" />
                          <span>Edit Data</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(item.id, item.nama_fitur, item.method)
                          }
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          <span>Hapus Data</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && total > 1 && (
          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 sm:px-6 bg-muted/20">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(total, p + 1))}
                disabled={page === total}
              >
                Selanjutnya
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Halaman{" "}
                  <span className="font-medium text-foreground">{page}</span>{" "}
                  dari{" "}
                  <span className="font-medium text-foreground">{total}</span>
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm bg-card"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-r-none border-border/50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Tersebelum
                  </Button>
                  <div className="px-4 py-1.5 border-y border-border/50 text-sm font-medium text-foreground bg-muted/10">
                    {page}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-none border-border/50"
                    onClick={() => setPage((p) => Math.min(total, p + 1))}
                    disabled={page === total}
                  >
                    Selanjutnya
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <HakAksesFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onFormSuccess}
        initialData={editingHakAkses || undefined}
      />
    </div>
  );
}
