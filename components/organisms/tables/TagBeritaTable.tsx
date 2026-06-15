"use client";

import { useState } from "react";
import { Search, Plus, RefreshCw, Loader2, Hash } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/molecules/TablePagination";
import { TagFormModal } from "../modals/berita/TagFormModal";
import { useGetTagBeritaQuery } from "@/features/api/beritaApi";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export function TagBeritaTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: response, isFetching, refetch } = useGetTagBeritaQuery({
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
              placeholder="Cari tag..."
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
          <Plus className="h-4 w-4" /> Tambah Tag
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="text-foreground font-semibold">Tag</TableHead>
              <TableHead className="text-foreground font-semibold">Slug</TableHead>
              <TableHead className="text-foreground font-semibold text-center w-28">Total Berita</TableHead>
              <TableHead className="text-foreground font-semibold w-36">Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Hash className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm">Belum ada tag.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-muted/40 border-border/40">
                  <TableCell>
                    <Badge variant="outline" className="gap-1 text-sm font-medium border-primary/30 bg-primary/5 text-primary">
                      <Hash className="h-3 w-3" />
                      {t.nama}
                    </Badge>
                    {t.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.deskripsi}</p>}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono text-muted-foreground">{t.slug}</code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="text-xs">{t.total_berita}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.dibuat_pada ? format(new Date(t.dibuat_pada), "dd MMM yyyy", { locale: localeId }) : "—"}
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

      <TagFormModal isOpen={modalOpen} onOpenChange={setModalOpen} onSuccess={() => { setModalOpen(false); refetch(); }} />
    </div>
  );
}
