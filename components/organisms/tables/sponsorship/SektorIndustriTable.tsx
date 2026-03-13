"use client";

import { useState, useRef, useLayoutEffect, useCallback } from "react";
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

import { useGetSektorIndustriListQuery, useDeleteSektorIndustriMutation, SektorIndustri } from "@/features/api/sektorIndustriApi";
import { SektorIndustriModal } from "@/components/organisms/modals/sponsorship/SektorIndustriModal";
import { TablePagination } from "@/components/molecules/TablePagination";

export function SektorIndustriTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<SektorIndustri | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Sub-component: detects real DOM overflow
  const TruncatedText = useCallback(
    ({ id, text }: { id: number; text: string | null | undefined }) => {
      const ref = useRef<HTMLParagraphElement>(null);
      const [isOverflowing, setIsOverflowing] = useState(false);
      const expanded = expandedRows[id] ?? false;

      useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
      }, []);

      return (
        <div className="flex flex-col items-start gap-1 w-full overflow-hidden">
          <p
            ref={ref}
            className={`text-sm text-muted-foreground w-full ${
              expanded ? "whitespace-normal wrap-break-word" : "truncate"
            }`}
          >
            {text || "-"}
          </p>
          {(isOverflowing || expanded) && (
            <button
              onClick={() => toggleExpand(id)}
              className="text-xs font-medium text-primary hover:underline shrink-0"
            >
              {expanded ? "Sembunyikan" : "Tampilkan penuh"}
            </button>
          )}
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedRows],
  );

  const {
    data: response,
    isFetching: loading,
    refetch,
  } = useGetSektorIndustriListQuery({
    page,
    limit,
    search: searchQuery || undefined,
  });

  const listData = response?.data || [];
  const total = response?.meta?.totalPages || 0;

  const [deleteData] = useDeleteSektorIndustriMutation();

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Sektor Industri ${nama}?`)) return;

    try {
      await deleteData(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Sektor Industri ${nama} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description: error?.data?.error?.message || "Kesalahan jaringan saat menghapus data.",
      });
    }
  };

  const handleEdit = (data: SektorIndustri) => {
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
              placeholder="Cari sektor industri..."
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
              <TableHead className="w-[200px] text-foreground font-semibold">Nama Sektor</TableHead>
              <TableHead className="text-foreground font-semibold">Deskripsi</TableHead>
              <TableHead className="w-[100px] text-right text-foreground font-semibold">Aksi</TableHead>
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
                  <TableCell className="w-[200px] font-medium text-foreground align-top pt-3">{item.nama_sektor}</TableCell>
                  <TableCell className="max-w-0 align-top pt-3">
                    <TruncatedText id={item.id} text={item.deskripsi_sektor} />
                  </TableCell>
                  <TableCell className="w-[100px] text-right align-top pt-4">
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
                          onClick={() => handleDelete(item.id, item.nama_sektor)}
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

      <SektorIndustriModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onFormSuccess}
        initialData={editingData || undefined}
      />
    </div>
  );
}
