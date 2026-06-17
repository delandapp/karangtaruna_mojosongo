"use client";

import { useState } from "react";
import { Loader2, Download, BarChart2, Calendar } from "lucide-react";
import {
  useGetAnalitikQuery,
  useGetTopKontenQuery,
  useGetDaftarPlatformQuery,
  useExportAnalitikMutation,
} from "@/features/api/sosialMediaApi";
import { KartuSummary } from "./KartuSummary";
import { GrafikAnalitik } from "./GrafikAnalitik";
import { TabelTopKonten } from "./TabelTopKonten";
import { ComboBox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface AnalyticPageProps {
  initialPlatformSlug?: string;
}

export function AnalyticPage({ initialPlatformSlug }: AnalyticPageProps) {
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d">("30d");
  const [isExporting, setIsExporting] = useState(false);

  // Load platforms to map slugs/names
  const { data: platformResponse } = useGetDaftarPlatformQuery();
  const platforms = platformResponse?.data || [];

  // Automatically set initial platform filter if initialPlatformSlug is provided
  useState(() => {
    if (initialPlatformSlug && platforms.length > 0) {
      const match = platforms.find(
        (p) => p.slug.toLowerCase() === initialPlatformSlug.toLowerCase()
      );
      if (match) {
        setSelectedPlatformId(match.id);
      }
    }
  });

  const queryFilters = {
    platform_id: selectedPlatformId,
    periode: selectedPeriod,
  };

  // Fetch analytics data snapshots
  const { data: analyticsResponse, isLoading: isLoadingAnalytics } = useGetAnalitikQuery(queryFilters);
  const analyticsData = analyticsResponse?.data || [];

  // Fetch top contents
  const { data: topKontenResponse, isLoading: isLoadingTopKonten } = useGetTopKontenQuery({
    platform_id: selectedPlatformId,
  });
  const topKonten = topKontenResponse?.data || [];

  const [exportAnalitik] = useExportAnalitikMutation();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAnalitik(queryFilters).unwrap();
      const csvContent = result.data;

      if (!csvContent) {
        throw new Error("Data export kosong");
      }

      // Client-side file trigger
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const platformName = selectedPlatformId
        ? platforms.find((p) => p.id === selectedPlatformId)?.nama || "platform"
        : "semua_platform";

      link.setAttribute("href", url);
      link.setAttribute("download", `analitik_sosial_media_${platformName.toLowerCase()}_${selectedPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("✅ Laporan performa berhasil diexport ke CSV");
    } catch (error: any) {
      toast.error("Gagal melakukan export laporan", {
        description: error?.message || "Terjadi kesalahan pada sistem",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Convert platforms to ComboBoxItem structure
  const platformOptions = [
    { id: 0, nama: "Semua Platform" },
    ...platforms,
  ];

  const currentSelectedPlatform = platformOptions.find((p) => p.id === (selectedPlatformId || 0));

  const platformSlug = selectedPlatformId
    ? platforms.find((p) => p.id === selectedPlatformId)?.slug || ""
    : "";

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Analitik Performa</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau pertumbuhan pengikut, jangkauan tayang, dan rasio keterlibatan pemirsa di seluruh akun Anda.
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || isLoadingAnalytics}
          className="shadow-md rounded-xl font-semibold gap-1.5 h-9 text-xs shrink-0 self-start sm:self-auto"
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Export Laporan CSV
        </Button>
      </div>

      {/* Filter Options */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl">
        <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <BarChart2 className="size-4 text-primary" />
            <span className="text-sm font-semibold">Filter Analitik</span>
          </div>

          {/* Period Selection */}
          <Tabs
            value={selectedPeriod}
            onValueChange={(val: any) => setSelectedPeriod(val)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="7d" className="rounded-lg text-xs font-semibold px-4 flex items-center gap-1.5">
                <Calendar className="size-3.5" /> 7 Hari Terakhir
              </TabsTrigger>
              <TabsTrigger value="30d" className="rounded-lg text-xs font-semibold px-4 flex items-center gap-1.5">
                <Calendar className="size-3.5" /> 30 Hari Terakhir
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Platform Selector */}
          <div className="w-full md:max-w-[200px] shrink-0">
            <ComboBox
              title="Platform"
              data={platformOptions}
              selected={currentSelectedPlatform}
              onChange={(val: any) => {
                setSelectedPlatformId(val?.id === 0 ? undefined : val?.id);
              }}
              valueKey="id"
              labelKey="nama"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard Grid */}
      {isLoadingAnalytics ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Summary Cards */}
          <KartuSummary analyticsData={analyticsData} />

          {/* 2. Charts */}
          <div className="grid grid-cols-1 gap-6">
            <GrafikAnalitik analyticsData={analyticsData} />
          </div>

          {/* 3. Top Content Table */}
          {isLoadingTopKonten ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          ) : (
            <TabelTopKonten topKonten={topKonten} />
          )}
        </div>
      )}
    </div>
  );
}
