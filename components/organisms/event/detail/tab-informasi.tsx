"use client";

import React from "react";
import { type Event } from "@/features/api/eventApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface TabInformasiProps {
  event: Event;
}

export function TabInformasi({ event }: TabInformasiProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: localeId });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "perencanaan": return "bg-slate-500";
      case "persiapan": return "bg-blue-500";
      case "siap": return "bg-emerald-500";
      case "berlangsung": return "bg-amber-500";
      case "selesai": return "bg-emerald-700";
      case "dibatalkan": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-6 lg:w-2/3">
        <Card>
          <CardHeader>
            <CardTitle>Profil Event</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kode Event</p>
              <p className="font-semibold">{event.kode_event}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={`${getStatusColor(event.status_event)} mt-1 text-white hover:${getStatusColor(event.status_event)}`}>
                {event.status_event.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nama Event</p>
              <p>{event.nama_event}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Jenis Event</p>
              <p className="capitalize">{event.jenis_event.replace(/_/g, " ")}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Tema Event</p>
              <p>{event.tema_event || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
              <p className="whitespace-pre-wrap">{event.deskripsi || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tujuan (SMART)</CardTitle>
          </CardHeader>
          <CardContent>
            {event.tujuan && event.tujuan.length > 0 ? (
              <ul className="list-inside list-disc space-y-1">
                {event.tujuan.map((t, idx) => (
                  <li key={idx} className="text-sm">{t}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada tujuan yang ditentukan.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full flex-col gap-6 lg:w-1/3">
        <Card>
          <CardHeader>
            <CardTitle>Jadwal & Lokasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Waktu Pelaksanaan</p>
              <p className="text-sm mt-1">Mulai: <strong>{formatDate(event.tanggal_mulai)}</strong></p>
              <p className="text-sm">Selesai: <strong>{formatDate(event.tanggal_selesai)}</strong></p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lokasi</p>
              <p className="text-sm mt-1">{event.lokasi || "Belum ditentukan"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Target Peserta / Estimasi</p>
              <p className="text-sm mt-1">{event.target_peserta ? `${event.target_peserta} Orang` : "-"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Penyelenggara</p>
              <p className="text-sm mt-1">{event.organisasi?.nama_org || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dibuat Oleh</p>
              <p className="text-sm mt-1">{event.dibuat_oleh?.nama_lengkap || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dibuat Pada</p>
              <p className="text-sm mt-1">{formatDate(event.dibuat_pada)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
