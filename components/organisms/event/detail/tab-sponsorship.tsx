"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useGetSponsorsQuery } from "@/lib/redux/slices/sponsorship/sponsorApi";
import { useGetSponsorPipelinesQuery } from "@/lib/redux/slices/sponsorship/pipelineApi";
import { Loader2, TrendingUp, Handshake, FileText, CheckCircle2 } from "lucide-react";

interface TabSponsorshipProps {
  eventId: number;
}

const fmtCur = (val: any) => typeof val === 'number' ? `Rp ${val.toLocaleString('id-ID')}` : '-';

export function TabSponsorship({ eventId }: TabSponsorshipProps) {
  const { data: sponsorRes, isLoading: load1 } = useGetSponsorsQuery({});
  const { data: pipelineRes, isLoading: load2 } = useGetSponsorPipelinesQuery({ event_id: eventId });

  if (load1 || load2) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  const pipelines = pipelineRes?.data || [];
  
  const totalTarget = 150000000; 
  const terkumpul = pipelines.reduce((sum: number, item: any) => sum + Number(item.jumlah_diterima || 0), 0);
  const potensial = pipelines.reduce((sum: number, item: any) => sum + Number(item.jumlah_disepakati || 0), 0);
  const progressPercent = Math.min((terkumpul / totalTarget) * 100, 100);

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight">Dashboard Sponsorship</h2>
        <p className="text-sm text-muted-foreground">Ringkasan performa pencarian dana dan kemitraan untuk event ini.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Dana Terkumpul</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtCur(terkumpul)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {progressPercent.toFixed(1)}% dari target {fmtCur(totalTarget)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Potensi Pendapatan</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtCur(potensial)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total kesepakatan (MOU)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Sponsor</CardTitle>
            <Handshake className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsorRes?.meta?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Mitra yang terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Prospek Aktif</CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelines.filter((p:any) => ["prospek", "dihubungi", "negosiasi"].includes(p.status_pipeline)).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Berjalan untuk event ini</p>
          </CardContent>
        </Card>
      </div>

      {/* Target Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Pencapaian Target Sponsorship</CardTitle>
          <CardDescription>Event ID: {eventId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm font-medium">
            <span>{fmtCur(terkumpul)}</span>
            <span className="text-muted-foreground">{fmtCur(totalTarget)}</span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-in-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="border rounded-md p-3">
              <div className="text-xl font-bold">{pipelines.filter((p:any) => p.tier === "platinum").length}</div>
              <div className="text-xs text-muted-foreground">Platinum</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xl font-bold">{pipelines.filter((p:any) => p.tier === "gold").length}</div>
              <div className="text-xs text-muted-foreground">Gold</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xl font-bold">{pipelines.filter((p:any) => p.tier === "silver").length}</div>
              <div className="text-xs text-muted-foreground">Silver</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xl font-bold">{pipelines.filter((p:any) => p.tier === "bronze").length}</div>
              <div className="text-xs text-muted-foreground">Bronze</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
