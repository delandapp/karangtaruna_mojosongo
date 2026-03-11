"use client";

import React, { use, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useGetEventByIdQuery } from "@/features/api/eventApi";
import { useGetAnggaranQuery } from "@/features/api/anggaranApi";
import { TabInformasi } from "@/components/organisms/event/detail/tab-informasi";
import { TabAnggaran } from "@/components/organisms/event/detail/tab-anggaran";
import { TabPanitia } from "@/components/organisms/event/detail/tab-panitia";
import { TabRundown } from "@/components/organisms/event/detail/tab-rundown";

// ── Valid tabs ───────────────────────────────────────────────────────────────
const VALID_TABS = ["informasi", "anggaran", "panitia", "rundown"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isValidTab(tab: string | null): tab is TabValue {
  return VALID_TABS.includes(tab as TabValue);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ── Tab action buttons config ─────────────────────────────────────────────────
// Each tab can expose an "add" button in the header row next to TabsList.
// The actual open-state is managed inside each Tab* component via a ref callback.
// We use a simple approach: pass an `onAddClick` prop down so the button in the
// header triggers the create modal inside the child tab component.

export default function EventDetailPage(props: PageProps) {
  const params = use(props.params);
  const eventId = parseInt(params.id, 10);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isValidTab(tabParam) ? tabParam : "informasi";

  // Lifted "add" triggers — each is a function that the tab child will update via a callback ref
  const [addAnggaran,  setAddAnggaran]  = useState<(() => void) | null>(null);
  const [addPanitia,   setAddPanitia]   = useState<(() => void) | null>(null);
  const [addRundown,   setAddRundown]   = useState<(() => void) | null>(null);

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

  // Determine which button to show based on active tab
  const tabActions: Record<TabValue, { label: string; handler: (() => void) | null }> = {
    informasi: { label: "", handler: null },
    anggaran:  { label: "Buat Anggaran",      handler: addAnggaran },
    panitia:   { label: "Tambah Panitia",     handler: addPanitia },
    rundown:   { label: "Tambah Rundown",     handler: addRundown },
  };

  const currentAction = tabActions[activeTab];

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

              {/* ── Tab bar row with inline action button ── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 w-full">
                <TabsList className="h-9 w-full sm:w-auto grid grid-cols-4 sm:flex sm:flex-wrap">
                  <TabsTrigger value="informasi" className="text-xs sm:text-sm">Informasi</TabsTrigger>
                  <TabsTrigger value="anggaran"  className="text-xs sm:text-sm">Anggaran</TabsTrigger>
                  <TabsTrigger value="panitia"   className="text-xs sm:text-sm">Panitia</TabsTrigger>
                  <TabsTrigger value="rundown"   className="text-xs sm:text-sm">Rundown</TabsTrigger>
                </TabsList>

                {currentAction.handler && (
                  <Button
                    size="sm"
                    onClick={currentAction.handler}
                    className="w-full sm:w-auto gap-1.5 h-9 shadow-sm shadow-primary/20 hover:shadow-primary/30 transition-all shrink-0"
                  >
                    <Plus className="size-3.5" />
                    {currentAction.label}
                  </Button>
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
                <TabPanitia onRegisterAdd={(fn) => setAddPanitia(() => fn)} />
              </TabsContent>

              <TabsContent value="rundown">
                <TabRundown onRegisterAdd={(fn) => setAddRundown(() => fn)} />
              </TabsContent>
            </Tabs>
          )}
        </section>
      </div>
    </div>
  );
}
