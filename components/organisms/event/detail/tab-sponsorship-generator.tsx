"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ProposalTemplate } from "@/lib/types/proposal-template.types";
import { PROPOSAL_TEMPLATES } from "@/lib/constants/proposal-templates";

interface TabSponsorshipGeneratorProps {
  eventId: number;
}

export function TabSponsorshipGenerator({ eventId }: TabSponsorshipGeneratorProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);

  const handleStartEdit = () => {
    if (!selectedTemplate) return;
    router.push(`/dashboard/event/${eventId}/proposal-editor?template=${selectedTemplate.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Generator Proposal Sponsorship</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pilih template proposal sebagai dasar dokumen, lalu masuk ke editor untuk meng-customize.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PROPOSAL_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTemplate(template)}
              className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 shadow-lg"
                  : "border-border hover:border-muted-foreground/30 hover:shadow-md"
              }`}
            >
              <div className={`h-24 bg-linear-to-r ${template.accentColor} relative`}>
                {template.badge && (
                  <span className="absolute top-3 right-3 bg-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {template.badge}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-3 left-3 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="absolute bottom-3 left-4 flex gap-1 opacity-30">
                  <div className="w-8 h-10 bg-white/80 rounded-sm" />
                  <div className="w-8 h-10 bg-white/50 rounded-sm -mt-1" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-base">{template.nama}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{template.deskripsi}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleStartEdit} disabled={!selectedTemplate} size="lg" className="gap-2 shadow-sm shadow-primary/20">
          <Sparkles className="w-4 h-4" />
          Buka Editor Proposal
        </Button>
      </div>
    </div>
  );
}
