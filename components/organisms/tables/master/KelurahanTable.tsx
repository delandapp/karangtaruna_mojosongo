"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  MapPin,
  Building2,
  Landmark,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { KelurahanFormModal } from "../../modals/master/KelurahanFormModal";
import { KelurahanDeleteModal } from "../../modals/master/KelurahanDeleteModal";
import { TablePagination } from "@/components/molecules/TablePagination";
import { useGetKelurahanQuery } from "@/features/api/kelurahanApi";
import { useGetProvinsiQuery } from "@/features/api/provinsiApi";
import { useGetKotaQuery } from "@/features/api/kotaApi";
import { useGetKecamatanQuery } from "@/features/api/kecamatanApi";

interface KelurahanData {
  id: number;
  kode_wilayah: string;
  nama: string;
  m_kecamatan_id: number;
  m_kecamatan?: {
    nama: string;
    m_kota_id: number;
    m_kota?: {
      m_provinsi_id: number;
    }
  };
}

export function KelurahanTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterProvinsiId, setFilterProvinsiId] = useState<string>("");
  const [filterKotaId, setFilterKotaId] = useState<string>("");
  const [filterKecamatanId, setFilterKecamatanId] = useState<string>("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editingData, setEditingData] = useState<KelurahanData | null>(null);
  const [deletingData, setDeletingData] = useState<{ id: number; nama: string; kecamatan?: string } | null>(null);

  // Dropdown provinsi
  const { data: provinsiRes } = useGetProvinsiQuery({ filter: { dropdown: true } });
  const provinsiList = provinsiRes?.data || [];

  // Dropdown kota (filtered by provinsi)
  const { data: kotaRes } = useGetKotaQuery({
    filter: { dropdown: true },
    m_provinsi_id: filterProvinsiId || undefined,
  });
  const kotaList = kotaRes?.data || [];

  // Dropdown kecamatan (filtered by kota)
  const { data: kecamatanRes } = useGetKecamatanQuery({
    filter: { dropdown: true },
    m_kota_id: filterKotaId || undefined,
    m_provinsi_id: !filterKotaId && filterProvinsiId ? filterProvinsiId : undefined,
  });
  const kecamatanList = kecamatanRes?.data || [];

  const {
    data: response,
    isFetching: loading,
    refetch,
  } = useGetKelurahanQuery({
    page,
    limit,
    search: searchQuery || undefined,
    m_kecamatan_id: filterKecamatanId || undefined,
    m_kota_id: !filterKecamatanId && filterKotaId ? filterKotaId : undefined,
    m_provinsi_id: !filterKecamatanId && !filterKotaId && filterProvinsiId ? filterProvinsiId : undefined,
  });

  const listData = response?.data || [];
  const total = response?.meta?.totalPages || 0;

  const handleProvinsiChange = (val: string) => {
    setFilterProvinsiId(val === "all" ? "" : val);
    setFilterKotaId("");
    setFilterKecamatanId("");
    setPage(1);
  };

  const handleKotaChange = (val: string) => {
    setFilterKotaId(val === "all" ? "" : val);
    setFilterKecamatanId("");
    setPage(1);
  };

  const handleKecamatanChange = (val: string) => {
    setFilterKecamatanId(val === "all" ? "" : val);
    setPage(1);
  };

  const handleEdit = (data: KelurahanData) => {
    setEditingData(data);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingData(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: number, nama: string, kecamatan?: string) => {
    setDeletingData({ id, nama, kecamatan });
    setIsDeleteOpen(true);
  };

  const onFormSuccess = () => {
    setIsFormOpen(false);
    refetch();
  };

  const onDeleteSuccess = () => {
    setIsDeleteOpen(false);
    refetch();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex w-full items-center gap-2 flex-wrap">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari kelurahan..."
              className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50"
              value={searchQuery}
              onChange={(e: any) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Filter Provinsi */}
          <Select value={filterProvinsiId} onValueChange={handleProvinsiChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-card/50 backdrop-blur">
              <MapPin className="mr-2 size-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Provinsi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Provinsi</SelectItem>
              {provinsiList.map((prov: any) => (
                <SelectItem key={prov.id} value={String(prov.id)}>
                  {prov.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Kota */}
          <Select value={filterKotaId} onValueChange={handleKotaChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-card/50 backdrop-blur">
              <Building2 className="mr-2 size-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Kota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kota</SelectItem>
              {kotaList.map((kota: any) => (
                <SelectItem key={kota.id} value={String(kota.id)}>
                  {kota.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Kecamatan */}
          <Select value={filterKecamatanId} onValueChange={handleKecamatanChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-card/50 backdrop-blur">
              <Landmark className="mr-2 size-4 text-muted-foreground" />
              <SelectValue placeholder="Semua Kecamatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kecamatan</SelectItem>
              {kecamatanList.map((kec: any) => (
                <SelectItem key={kec.id} value={String(kec.id)}>
                  {kec.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="w-[150px] text-foreground font-semibold">
                  Kode Wilayah
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Nama Kelurahan
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Kecamatan
                </TableHead>
                <TableHead className="text-right text-foreground font-semibold w-[100px]">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="mb-2 size-6 animate-spin text-primary" />
                      <span>Memuat data kelurahan...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : listData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Tidak ada data yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                listData.map((item: KelurahanData) => (
                  <TableRow
                    key={item.id}
                    className="group transition-colors hover:bg-muted/40 border-border/40"
                  >
                    <TableCell className="font-medium text-foreground">
                      {item.kode_wilayah}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {item.nama}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.m_kecamatan?.nama || "-"}
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
                            onClick={() => handleEdit(item)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 size-4" />
                            <span>Edit Data</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item.id, item.nama, item.m_kecamatan?.nama)}
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
        </div>

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

      <KelurahanFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={onFormSuccess}
        initialData={editingData || undefined}
      />

      <KelurahanDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onSuccess={onDeleteSuccess}
        data={deletingData}
      />
    </div>
  );
}
