"use client";

import React, { useState } from "react";
import { useGetSponsorPipelinesQuery } from "@/lib/redux/slices/sponsorship/pipelineApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, GripVertical } from "lucide-react";

import { PipelineSponsorFormModal } from "@/components/organisms/modals/sponsorship/PipelineSponsorFormModal";

interface TabSponsorshipManajemenProps {
  eventId: number;
}

const fmtCur = (val: any) => typeof val === 'number' ? `Rp ${val.toLocaleString('id-ID')}` : '-';

const StatusKolom = ["prospek", "dihubungi", "negosiasi", "dikonfirmasi", "lunas", "selesai", "batal"];

export function TabSponsorshipManajemen({ eventId }: TabSponsorshipManajemenProps) {
  const { data: response, isLoading } = useGetSponsorPipelinesQuery({ event_id: eventId });
  const pipelines = response?.data || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<any>(null);

  const handleAdd = () => {
    setSelectedPipeline(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pipeline: any) => {
    setSelectedPipeline(pipeline);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  const columns = StatusKolom.map((status) => ({
    status,
    items: pipelines.filter((p: any) => p.status_pipeline === status),
  }));

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Manajemen Pipeline Sponsor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola prospek sponsor dari awal negosiasi hingga lunas (Kanban Board).
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Prospek
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => (
          <div key={col.status} className="w-80 flex-shrink-0 flex flex-col bg-slate-50 dark:bg-slate-900 border rounded-lg overflow-hidden">
            <div className="p-3 border-b bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
              <h3 className="font-semibold capitalize text-sm">{col.status}</h3>
              <Badge variant="secondary" className="text-xs">
                {col.items.length}
              </Badge>
            </div>
            
            <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[500px]">
              {col.items.map((item: any) => (
                <Card 
                  key={item.id} 
                  onClick={() => handleEdit(item)}
                  className="cursor-pointer hover:ring-2 ring-primary/20 transition-all border-l-4 border-l-primary"
                >
                  <CardHeader className="p-3 pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold line-clamp-1">
                        {item.sponsor?.m_perusahaan?.nama || "Perusahaan Anonim"}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground capitalize">
                        Tier: {item.tier}
                      </span>
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                        {fmtCur(Number(item.jumlah_disepakati || 0))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {col.items.length === 0 && (
                <div className="h-24 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground text-xs">
                  Seret kesini
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <PipelineSponsorFormModal
        eventId={eventId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={selectedPipeline}
      />
    </div>
  );
}
