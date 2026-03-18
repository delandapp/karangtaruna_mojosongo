"use client";

import React, { use, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGetEventByIdQuery } from "@/features/api/eventApi";
import { useGetAnggaranQuery } from "@/features/api/anggaranApi";
import { TabInformasi } from "@/components/organisms/event/detail/tab-informasi";
import { TabAnggaran } from "@/components/organisms/event/detail/tab-anggaran";
import { TabPanitia } from "@/components/organisms/event/detail/tab-panitia";
import { TabRundown } from "@/components/organisms/event/detail/tab-rundown";
import { TabSponsorship } from "@/components/organisms/event/detail/tab-sponsorship";
import { TabSponsorshipManajemen } from "@/components/organisms/event/detail/tab-sponsorship-manajemen";
import { TabSponsorshipGenerator } from "@/components/organisms/event/detail/tab-sponsorship-generator";

// ── Valid tabs ───────────────────────────────────────────────────────────────
const VALID_TABS = ["informasi", "anggaran", "panitia", "rundown", "sponsorship", "sponsorship-manajemen", "sponsorship-generator"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isValidTab(tab: string | null): tab is TabValue {
  return VALID_TABS.includes(tab as TabValue);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EventDetailPage(props: PageProps) {
  const params = use(props.params);
  const eventId = parseInt(params.id, 10);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(tabParam) ? tabParam : "informasi";

  // ── Lifted add triggers (each tab registers its open-form fn) ─────────────
  const [addAnggaran,  setAddAnggaran]  = useState<(() => void) | null>(null);
  const [addPanitia,   setAddPanitia]   = useState<(() => void) | null>(null);
  const [addRundown,   setAddRundown]   = useState<(() => void) | null>(null);

  // ── Lifted refresh triggers (only tabs that need manual refresh) ───────────
  const [refreshPanitia, setRefreshPanitia] = useState<(() => void) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: eventData, isLoading: isLoadingEvent } = useGetEventByIdQuery(eventId, {
    skip: isNaN(eventId),
  });

  const { data: anggaranData, isLoading: isLoadingAnggaran } = useGetAnggaranQuery(
    { eventId, limit: 100 },
    { skip: isNaN(eventId) }
  );

  const event = eventData?.data;

  const handleTabChange = useCallback(
    (value: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", value);
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // ── Tab action config ─────────────────────────────────────────────────────
  const tabActions: Record<TabValue, { label: string; handler: (() => void) | null }> = {
    informasi: { label: "",                 handler: null },
    anggaran:  { label: "Buat Anggaran",    handler: addAnggaran },
    panitia:   { label: "Tambah Panitia",   handler: addPanitia },
    rundown:   { label: "Tambah Rundown",   handler: addRundown },
    sponsorship: { label: "", handler: null },
    "sponsorship-manajemen": { label: "", handler: null },
    "sponsorship-generator": { label: "", handler: null },
  };

  // ── Tab refresh config (only tabs that expose a refresh fn) ───────────────
  const tabRefreshMap: Partial<Record<TabValue, (() => void) | null>> = {
    panitia: refreshPanitia,
  };

  const currentAction  = tabActions[activeTab];
  const currentRefresh = tabRefreshMap[activeTab] ?? null;

  const handleRefresh = async () => {
    if (!currentRefresh) return;
    setIsRefreshing(true);
    currentRefresh();
    // Small visual delay so the spin is visible
    setTimeout(() => setIsRefreshing(false), 800);
  };

  if (isNaN(eventId)) {
    return (
      <div className="flex flex-col">
        <DashboardHeader breadcrumb="Data Master / Event / Error" />
        <div className="p-6">
          <p className="text-red-500">ID Event tidak valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb={`Data Master / Event / ${event?.kode_event || "Loading..."}`} />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Detail Event</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Melihat detail lengkap informasi, anggaran, kepanitiaan, dan rundown acara.
              </p>
            </div>
          </div>

          {!event && isLoadingEvent ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground animate-pulse">
              Memuat data event...
            </div>
          ) : !event ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              Data event tidak ditemukan.
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

              {/* ── Tab bar row with action buttons ── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 w-full">
                <TabsList className="h-9 w-full sm:w-auto grid grid-cols-4 sm:flex sm:flex-wrap">
                  <TabsTrigger value="informasi" className="text-xs sm:text-sm">Informasi</TabsTrigger>
                  <TabsTrigger value="anggaran"  className="text-xs sm:text-sm">Anggaran</TabsTrigger>
                  <TabsTrigger value="panitia"   className="text-xs sm:text-sm">Panitia</TabsTrigger>
                  <TabsTrigger value="rundown"   className="text-xs sm:text-sm">Rundown</TabsTrigger>
                  <TabsTrigger value="sponsorship" className="text-xs sm:text-sm">Sponsorship</TabsTrigger>
                  <TabsTrigger value="sponsorship-manajemen" className="text-xs sm:text-sm">Pipeline Sponsor</TabsTrigger>
                  <TabsTrigger value="sponsorship-generator" className="text-xs sm:text-sm">Proposal</TabsTrigger>
                </TabsList>

                {/* Right-side: Refresh (if tab supports it) + Add button */}
                {(currentRefresh || currentAction.handler) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {currentRefresh && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-9 w-9"
                        title="Refresh data"
                      >
                        <RefreshCw
                          className={`size-3.5 ${isRefreshing ? "animate-spin text-muted-foreground" : ""}`}
                        />
                      </Button>
                    )}
                    {currentAction.handler && (
                      <Button
                        size="sm"
                        onClick={currentAction.handler}
                        className="w-full sm:w-auto gap-1.5 h-9 shadow-sm shadow-primary/20 hover:shadow-primary/30 transition-all"
                      >
                        <Plus className="size-3.5" />
                        {currentAction.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <TabsContent value="informasi">
                <TabInformasi event={event} />
              </TabsContent>

              <TabsContent value="anggaran">
                <TabAnggaran
                  eventId={eventId}
                  anggaranList={anggaranData?.data || []}
                  isLoading={isLoadingAnggaran}
                  onRegisterAdd={(fn) => setAddAnggaran(() => fn)}
                />
              </TabsContent>

              <TabsContent value="panitia">
                <TabPanitia
                  eventId={eventId}
                  onRegisterAdd={(fn) => setAddPanitia(() => fn)}
                  onRegisterRefresh={(fn) => setRefreshPanitia(() => fn)}
                />
              </TabsContent>

              <TabsContent value="rundown">
                <TabRundown
                  eventId={eventId}
                  onRegisterAdd={(fn) => setAddRundown(() => fn)}
                />
              </TabsContent>

              <TabsContent value="sponsorship">
                <TabSponsorship eventId={eventId} />
              </TabsContent>

              <TabsContent value="sponsorship-manajemen">
                <TabSponsorshipManajemen eventId={eventId} />
              </TabsContent>

              <TabsContent value="sponsorship-generator">
                <TabSponsorshipGenerator eventId={eventId} />
              </TabsContent>
            </Tabs>
          )}
        </section>
      </div>
    </div>
  );
}
