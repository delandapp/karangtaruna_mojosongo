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

import { useGetSkalaPerusahaanListQuery, useDeleteSkalaPerusahaanMutation, SkalaPerusahaan } from "@/features/api/skalaPerusahaanApi";
import { SkalaPerusahaanModal } from "@/components/organisms/modals/sponsorship/SkalaPerusahaanModal";
import { TablePagination } from "@/components/molecules/TablePagination";

export function SkalaPerusahaanTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<SkalaPerusahaan | null>(null);

  const {
    data: response,
    isFetching: loading,
    refetch,
  } = useGetSkalaPerusahaanListQuery({
    page,
    limit,
    search: searchQuery || undefined,
  });

  const listData = response?.data || [];
  const total = response?.meta?.totalPages || 0;

  const [deleteData] = useDeleteSkalaPerusahaanMutation();

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Skala Perusahaan ${nama}?`)) return;

    try {
      await deleteData(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Skala Perusahaan ${nama} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description: error?.data?.error?.message || "Kesalahan jaringan saat menghapus data.",
      });
    }
  };

  const handleEdit = (data: SkalaPerusahaan) => {
    setEditingData(data);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingData(null);
    setIsModalOpen(true);
  };

  const onFormSuccess = () => {
    setIsModalOpen(false);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari skala perusahaan..."
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
            onClick={() => refetch()}
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
              <TableHead className="w-[80px] text-foreground font-semibold">ID</TableHead>
              <TableHead className="text-foreground font-semibold">Nama Skala</TableHead>
              <TableHead className="text-right text-foreground font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                    <span>Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : listData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  Tidak ada data yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              listData.map((item) => (
                <TableRow
                  key={item.id}
                  className="group transition-colors hover:bg-muted/40 border-border/40"
                >
                  <TableCell className="font-medium text-muted-foreground">#{item.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{item.nama}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                          <Pencil className="mr-2 size-4" />
                          <span>Edit Data</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id, item.nama)}
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

      <SkalaPerusahaanModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onFormSuccess}
        initialData={editingData || undefined}
      />
    </div>
  );
}
