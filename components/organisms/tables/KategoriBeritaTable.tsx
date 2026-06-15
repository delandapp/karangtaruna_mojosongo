"use client";

import { useState } from "react";
import { Search, Plus, RefreshCw, Loader2, Layers } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/molecules/TablePagination";
import { KategoriFormModal } from "../modals/berita/KategoriFormModal";
import { useGetKategoriBeritaQuery } from "@/features/api/beritaApi";

export function KategoriBeritaTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: response, isFetching, refetch } = useGetKategoriBeritaQuery({
    page, limit, search: search || undefined,
  });

  const data = response?.data || [];
  const totalPages = response?.meta?.totalPages || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-card/50 backdrop-blur focus-visible:ring-primary/50"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} className="bg-card/50 backdrop-blur border-border/50">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Tambah Kategori
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-foreground font-semibold">Nama</TableHead>
              <TableHead className="text-foreground font-semibold">Slug</TableHead>
              <TableHead className="text-foreground font-semibold">Warna</TableHead>
              <TableHead className="text-foreground font-semibold w-20 text-center">Urutan</TableHead>
              <TableHead className="text-foreground font-semibold w-20 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Layers className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm">Belum ada kategori.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((k: any) => (
                <TableRow key={k.id} className="hover:bg-muted/40 border-border/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {k.warna_hex && <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: k.warna_hex }} />}
                      <span className="font-medium text-sm">{k.nama}</span>
                    </div>
                    {k.deskripsi && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{k.deskripsi}</p>}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono text-muted-foreground">{k.slug}</code>
                  </TableCell>
                  <TableCell>
                    {k.warna_hex ? (
                      <Badge variant="outline" style={{ borderColor: `${k.warna_hex}50`, color: k.warna_hex, backgroundColor: `${k.warna_hex}15` }} className="text-xs font-mono">
                        {k.warna_hex}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{k.urutan}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={k.is_aktif ? "bg-primary/10 text-primary border-primary/30 text-xs" : "text-xs"}>
                      {k.is_aktif ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isFetching && totalPages > 0 && (
          <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
        )}
      </div>

      <KategoriFormModal isOpen={modalOpen} onOpenChange={setModalOpen} onSuccess={() => { setModalOpen(false); refetch(); }} />
    </div>
  );
}
