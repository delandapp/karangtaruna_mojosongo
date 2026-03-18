"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PortalSponsorPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Selamat Datang, PT Telkom Indonesia</h1>
        <p className="text-muted-foreground">Kelola kemitraan dan unduh laporan transparansi terkait sponsorship Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Status Kemitraan Aktif</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Platinum Tier</div>
            <p className="text-xs text-muted-foreground mt-1">Event: Gebyar Kemah Karang Taruna 2026</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Kontribusi</CardTitle>
            <span className="w-4 h-4 text-primary font-bold">Rp</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50.000.000</div>
            <p className="text-xs text-muted-foreground mt-1">Lunas (2 Invoice terbayar)</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8">Dokumen & Laporan</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>MOU Kesepakatan Lintas Sektoral</CardTitle>
            </div>
            <CardDescription>Tertanggal 15 Maret 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Unduh MOU (.pdf)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Impact Report Kuartal 1</CardTitle>
            </div>
            <CardDescription>Ringkasan penerima manfaat sponsorship</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Unduh Laporan Impact (.pdf)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
