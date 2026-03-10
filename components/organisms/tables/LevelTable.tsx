"use client";

import { useState, useEffect, useCallback } from "react";
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
import { LevelFormModal } from "../modals/LevelFormModal";
import { TablePagination } from "../../molecules/TablePagination";
import {
  useGetLevelsQuery,
  useDeleteLevelMutation,
} from "@/features/api/levelApi";

interface LevelData {
  id: number;
  nama_level: string;
  createdAt: string;
}

export function LevelTable() {
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<LevelData | null>(null);

  const {
    data: response,
    isFetching: loading,
    refetch,
  } = useGetLevelsQuery({
    page,
    limit,
    search: searchQuery || undefined,
  });

  const levels = response?.data || [];
  const total = response?.meta?.totalPages || 0;

  const fetchLevels = () => {
    refetch();
  };

  const [deleteLevel] = useDeleteLevelMutation();

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus level ${nama}?`))
      return;

    try {
      await deleteLevel(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Level ${nama} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description:
          error?.data?.error?.message ||
          "Kesalahan jaringan saat menghapus data.",
      });
    }
  };

  const handleEdit = (level: LevelData) => {
    setEditingLevel(level);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingLevel(null);
    setIsModalOpen(true);
  };

  const onFormSuccess = () => {
    setIsModalOpen(false);
    fetchLevels();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama level..."
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
            onClick={() => fetchLevels()}
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
            Tambah Data
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[300px] text-foreground font-semibold">
                Nama Level
              </TableHead>
              <TableHead className="text-right text-foreground font-semibold">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                    <span>Memuat data level...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : levels.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-32 text-center text-muted-foreground"
                >
                  Tidak ada data yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              levels.map((level) => (
                <TableRow
                  key={level.id}
                  className="group transition-colors hover:bg-muted/40 border-border/40"
                >
                  <TableCell className="font-medium text-foreground">
                    <Badge
                      variant="secondary"
                      className={`font-medium ${
                        level.nama_level?.toLowerCase() === "superuser"
                          ? "bg-destructive/10 text-destructive"
                          : level.nama_level?.toLowerCase() === "admin"
                            ? "bg-indigo-500/10 text-indigo-500 font-semibold"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {level.nama_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-8 p-0 text-foreground opacity-100 sm:group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
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
                          onClick={() => handleEdit(level)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 size-4" />
                          <span>Edit Data</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(level.id, level.nama_level)
                          }
                          className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4 text-destructive" />
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

        {!loading && total > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={total}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      <LevelFormModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onFormSuccess}
        initialData={editingLevel || undefined}
      />
    </div>
  );
}
