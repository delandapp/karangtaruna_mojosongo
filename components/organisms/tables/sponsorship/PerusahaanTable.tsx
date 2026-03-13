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
  Filter,
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

import { useGetPerusahaanListQuery, useDeletePerusahaanMutation, Perusahaan } from "@/features/api/perusahaanApi";
import { useGetSektorIndustriListQuery } from "@/features/api/sektorIndustriApi";
import { useGetSkalaPerusahaanListQuery } from "@/features/api/skalaPerusahaanApi";
import { PerusahaanFormModal } from "@/components/organisms/modals/sponsorship/PerusahaanFormModal";
import { TablePagination } from "@/components/molecules/TablePagination";
import { ComboBox } from "@/components/ui/combobox";

export function PerusahaanTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filter States
  const [filterSektorId, setFilterSektorId] = useState<number | undefined>();
  const [filterSkalaId, setFilterSkalaId] = useState<number | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Perusahaan | null>(null);
  
  // Fetch dropdowns for filters
  const { data: sektorDropdown } = useGetSektorIndustriListQuery({ dropdown: true });
  const { data: skalaDropdown } = useGetSkalaPerusahaanListQuery({ dropdown: true });

  const {
    data: response,
    isFetching: loading,
    refetch,
  } = useGetPerusahaanListQuery({
    page,
    limit,
    search: searchQuery || undefined,
    m_sektor_industri_id: filterSektorId,
    m_skala_perusahaan_id: filterSkalaId,
  });

  const listData = response?.data || [];
  const total = response?.meta?.totalPages || 0;

  const [deleteData] = useDeletePerusahaanMutation();

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus Perusahaan ${nama}?`)) return;

    try {
      await deleteData(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Perusahaan ${nama} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description: error?.data?.error?.message || "Kesalahan jaringan saat menghapus data.",
      });
    }
  };

  const handleEdit = (data: Perusahaan) => {
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

  const clearFilters = () => {
    setFilterSektorId(undefined);
    setFilterSkalaId(undefined);
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari perusahaan..."
              className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e: any) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <div className="w-40">
            <ComboBox
              data={sektorDropdown?.data?.map(s => ({ id: s.id.toString(), nama: s.nama_sektor })) || []}
              selected={filterSektorId?.toString() || ""}
              onChange={(val: any) => {
                const selectedId = val && typeof val === "object" ? val.id : undefined;
                setFilterSektorId(selectedId ? Number(selectedId) : undefined);
                setPage(1);
              }}
              title="Filter Sektor"
            />
          </div>
          
          <div className="w-40">
             <ComboBox
              data={skalaDropdown?.data?.map(s => ({ id: s.id.toString(), nama: s.nama })) || []}
              selected={filterSkalaId?.toString() || ""}
              onChange={(val: any) => {
                const selectedId = val && typeof val === "object" ? val.id : undefined;
                setFilterSkalaId(selectedId ? Number(selectedId) : undefined);
                setPage(1);
              }}
              title="Filter Skala"
            />
          </div>

          {(searchQuery || filterSektorId || filterSkalaId) && (
             <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground">
               Hapus Filter
             </Button>
          )}

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
        </div>
        
        <Button
          onClick={handleCreate}
          className="shrink-0 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 w-full md:w-auto"
        >
          <Plus className="mr-2 size-4" />
          Tambah Data
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-foreground font-semibold">Perusahaan</TableHead>
              <TableHead className="text-foreground font-semibold">Sektor & Skala</TableHead>
              <TableHead className="text-foreground font-semibold">Kontak</TableHead>
              <TableHead className="text-foreground font-semibold">Lokasi</TableHead>
              <TableHead className="text-right text-foreground font-semibold">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                    <span>Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : listData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Tidak ada data yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              listData.map((item) => (
                <TableRow
                  key={item.id}
                  className="group transition-colors hover:bg-muted/40 border-border/40"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{item.nama}</span>
                      {item.website && (
                         <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                            {item.website}
                         </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {item.sektor && <Badge variant="secondary" className="w-fit">{item.sektor.nama_sektor}</Badge>}
                      {item.skala && <Badge variant="outline" className="w-fit">{item.skala.nama}</Badge>}
                      {!item.sektor && !item.skala && <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      {item.nama_kontak ? (
                        <>
                          <span className="font-medium text-foreground">{item.nama_kontak}</span>
                          <span className="text-xs">{item.jabatan_kontak || "PIC"}</span>
                          {item.no_handphone && <span className="text-xs mt-1">{item.no_handphone}</span>}
                        </>
                      ) : (
                         <span>-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm text-muted-foreground">
                      {item.m_kota?.nama || item.m_provinsi?.nama ? (
                        <>
                          <span className="font-medium text-foreground">{item.m_kota?.nama || "Kota -"}</span>
                          <span className="text-xs">{item.m_provinsi?.nama || "Provinsi -"}</span>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
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

      <PerusahaanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onFormSuccess}
        initialData={editingData || undefined}
      />
    </div>
  );
}
