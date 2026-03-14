"use client";

import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Loader2, CalendarDays, Plus, MoreHorizontal, Pencil, Trash2, Clock, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useGetRundownQuery,
  type RundownAcara,
} from "@/features/api/rundownApi";

import { RundownFormModal } from "@/components/organisms/modals/rundown/RundownFormModal";
import { RundownDeleteModal } from "@/components/organisms/modals/rundown/RundownDeleteModal";

interface TabRundownProps {
  eventId: number;
  onRegisterAdd?: (fn: () => void) => void;
  onRegisterRefresh?: (fn: () => void) => void;
}

export function TabRundown({
  eventId,
  onRegisterAdd,
  onRegisterRefresh,
}: TabRundownProps) {
  const { data: response, isFetching, refetch } = useGetRundownQuery({
    eventId,
  });

  const rundownList = response?.data || [];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRundown, setSelectedRundown] = useState<RundownAcara | null>(
    null
  );
  // Default hari_ke for the modal when opened for the first time
  const [defaultHariKe, setDefaultHariKe] = useState<number>(1);

  const handleOpenForm = useCallback(
    (rundown?: RundownAcara, defaultHari?: number) => {
      setSelectedRundown(rundown || null);
      setDefaultHariKe(defaultHari ?? 1);
      setIsFormOpen(true);
    },
    []
  );

  const handleOpenDelete = useCallback((rundown: RundownAcara) => {
    setSelectedRundown(rundown);
    setIsDeleteOpen(true);
  }, []);

  // Register parent events
  const registeredRef = useRef(false);
  useEffect(() => {
    if (!registeredRef.current) {
      registeredRef.current = true;
      if (onRegisterAdd) {
        onRegisterAdd(() => handleOpenForm());
      }
      if (onRegisterRefresh) {
        onRegisterRefresh(() => refetch());
      }
    }
  }, [onRegisterAdd, onRegisterRefresh, handleOpenForm, refetch]);

  // Group rundown by Day (hari_ke)
  const groupedRundown = useMemo(() => {
    const groups: Record<number, RundownAcara[]> = {};
    rundownList.forEach((item) => {
      if (!groups[item.hari_ke]) {
        groups[item.hari_ke] = [];
      }
      groups[item.hari_ke].push(item);
    });

    // Sort items within each day by urutan_no, then waktu_mulai
    Object.keys(groups).forEach((key) => {
      groups[parseInt(key)].sort((a, b) => {
        if (a.urutan_no !== b.urutan_no) return a.urutan_no - b.urutan_no;
        return a.waktu_mulai.localeCompare(b.waktu_mulai);
      });
    });

    return groups;
  }, [rundownList]);

  const days = Object.keys(groupedRundown).map(Number).sort((a, b) => a - b);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "belum":
        return "bg-slate-500 hover:bg-slate-600";
      case "berjalan":
        return "bg-blue-500 hover:bg-blue-600";
      case "selesai":
        return "bg-emerald-500 hover:bg-emerald-600";
      case "dilewati":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "belum":
        return "Belum Mulai";
      case "berjalan":
        return "Sedang Berjalan";
      case "selesai":
        return "Selesai";
      case "dilewati":
        return "Dilewati";
      default:
        return status;
    }
  };

  if (isFetching && rundownList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Memuat rundown acara...</span>
      </div>
    );
  }

  if (rundownList.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-14 text-center text-muted-foreground bg-muted/10 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CalendarDays className="h-8 w-8 text-primary/60" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Belum ada Rundown Acara
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan jadwal dan urutan kegiatan untuk event ini.
            </p>
          </div>
          <Button onClick={() => handleOpenForm()} className="mt-1">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Rundown
          </Button>
        </div>
        <RundownFormModal
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          eventId={eventId}
          initialData={selectedRundown}
          defaultHariKe={defaultHariKe}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Stats Bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="text-foreground">{rundownList.length} Kegiatan</span>
        </div>
        <Badge variant="outline" className="text-xs rounded-full">
          {days.length} Hari
        </Badge>
        <Badge variant="secondary" className="text-xs rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
          {rundownList.filter((r) => r.status === "selesai").length} Selesai
        </Badge>
      </div>

      {/* ── Timeline grouping by day ── */}
      <div className="space-y-8">
        {days.map((day) => (
          <div key={day} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-lg font-semibold tracking-tight">
                Hari {day}
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium bg-background"
                onClick={() => handleOpenForm(undefined, day)}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Tambah Kegiatan Hari {day}
              </Button>
            </div>

            <div className="grid gap-3 flex-col">
              {groupedRundown[day].map((item) => (
                <Card
                  key={item.id}
                  className="transition-colors hover:bg-muted/30 group"
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Time Column */}
                    <div className="flex items-center gap-2 sm:w-32 shrink-0">
                      <div className="flex flex-col text-center rounded bg-primary/10 px-3 py-2 text-primary">
                        <span className="text-sm font-bold tracking-tight">
                          {item.waktu_mulai}
                        </span>
                        <span className="text-[10px] font-medium opacity-70">
                          - {item.waktu_selesai} -
                        </span>
                      </div>
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border">
                          #{item.urutan_no}
                        </span>
                        <h4 className="text-base font-semibold leading-none truncate">
                          {item.nama_kegiatan}
                        </h4>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 rounded ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>

                      {item.keterangan && (
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                          {item.keterangan}
                        </p>
                      )}

                      {item.pic && (
                        <div className="flex items-center pt-2 gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5 opacity-70" />
                          <span>PIC: {item.pic.nama_lengkap}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="shrink-0 sm:ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenForm(item, item.hari_ke)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Edit Kegiatan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(item)}
                            className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <RundownFormModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        eventId={eventId}
        initialData={selectedRundown}
        defaultHariKe={defaultHariKe}
        onSuccess={refetch}
      />
      <RundownDeleteModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        eventId={eventId}
        rundownId={selectedRundown?.id ?? null}
        activityName={selectedRundown?.nama_kegiatan}
        onSuccess={refetch}
      />
    </div>
  );
}
