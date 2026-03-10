"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { TablePagination } from "../../molecules/TablePagination";

type Status = "Selesai" | "Proses" | "Menunggu" | "Dibatalkan";

interface DataRow {
  id: number;
  name: string;
  date: string;
  category: string;
  description: string;
  location: string;
  status: Status;
}

const MOCK_DATA: DataRow[] = [
  {
    id: 1,
    name: "Budi Santoso",
    date: "07/03/2026",
    category: "Kegiatan",
    description: "Kerja bakti RT 03 bersih desa",
    location: "RT 03",
    status: "Selesai",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    date: "07/03/2026",
    category: "Keuangan",
    description: "Iuran bulanan anggota Maret",
    location: "RT 05",
    status: "Menunggu",
  },
  {
    id: 3,
    name: "Ahmad Wijaya",
    date: "06/03/2026",
    category: "Kegiatan",
    description: "Pelatihan keterampilan digital",
    location: "RT 01",
    status: "Proses",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    date: "06/03/2026",
    category: "Laporan",
    description: "Laporan kegiatan sosial Februari",
    location: "RT 07",
    status: "Dibatalkan",
  },
  {
    id: 5,
    name: "Rudi Hermawan",
    date: "05/03/2026",
    category: "Kegiatan",
    description: "Turnamen voli antar RT",
    location: "RT 02",
    status: "Selesai",
  },
];

const STATUS_STYLES: Record<Status, string> = {
  Selesai:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  Proses: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Menunggu:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  Dibatalkan: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const TABS = ["Semua", "Selesai", "Proses", "Menunggu", "Dibatalkan"] as const;

export function DataTable() {
  const [activeTab, setActiveTab] = useState<string>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const filtered =
    activeTab === "Semua"
      ? MOCK_DATA
      : MOCK_DATA.filter((d) => d.status === activeTab);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">
            Data Terbaru
          </CardTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <Eye className="size-3.5" />
              Lihat semua
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <Download className="size-3.5" />
              Ekspor
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="h-9 bg-muted/50">
            {TABS.map((tab) => {
              const count =
                tab === "Semua"
                  ? MOCK_DATA.length
                  : MOCK_DATA.filter((d) => d.status === tab).length;
              return (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="text-xs data-[state=active]:shadow-sm"
                >
                  {tab}
                  {tab === "Menunggu" && count > 0 && (
                    <span className="ml-1.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Table */}
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 text-xs">#</TableHead>
                <TableHead className="text-xs">Nama</TableHead>
                <TableHead className="text-xs">Tanggal</TableHead>
                <TableHead className="text-xs">Kategori</TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Deskripsi
                </TableHead>
                <TableHead className="text-xs">Lokasi</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="w-10 text-xs"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, idx) => (
                  <TableRow key={row.id} className="group">
                    <TableCell className="text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.date}
                    </TableCell>
                    <TableCell className="text-xs">{row.category}</TableCell>
                    <TableCell className="hidden max-w-[200px] truncate text-xs text-muted-foreground md:table-cell">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-xs">{row.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-semibold border-0",
                          STATUS_STYLES[row.status],
                        )}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-accent group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 border-t border-border/50">
          <TablePagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / limit) || 1}
            onPageChange={setCurrentPage}
            limit={limit}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
