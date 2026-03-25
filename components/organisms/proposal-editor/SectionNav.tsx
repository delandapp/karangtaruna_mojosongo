"use client";

import React from "react";
import {
  BookOpen,
  Target,
  CalendarDays,
  Users,
  Wallet,
  Network,
  Gift,
  Mail,
  Check,
  Circle,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPOSAL_SECTIONS } from "@/lib/constants/proposal-templates";
import type {
  ProposalSectionId,
  ProposalData,
} from "@/lib/types/proposal-template.types";
import { isSectionComplete } from "@/lib/types/proposal-template.types";

// Icon map — lucide icon string → component
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Target,
  CalendarDays,
  Users,
  Wallet,
  Network,
  Gift,
  Mail,
  BarChart3,
};

interface SectionNavProps {
  activeSection: ProposalSectionId;
  onSectionChange: (id: ProposalSectionId) => void;
  data: ProposalData;
}

export function SectionNav({
  activeSection,
  onSectionChange,
  data,
}: SectionNavProps) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="px-3 pb-3 mb-1 border-b">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Struktur Dokumen
        </p>
      </div>

      {PROPOSAL_SECTIONS.map((section, index) => {
        const isActive = activeSection === section.id;
        const isComplete = isSectionComplete(section.id, data);
        const IconComp = ICON_MAP[section.icon] || Circle;

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "group flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {/* Number + icon */}
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-md shrink-0 text-xs font-bold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete && !isActive ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                index + 1
              )}
            </div>

            {/* Label + description */}
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "text-sm font-medium truncate",
                  isActive && "text-primary font-semibold"
                )}
              >
                {section.label}
              </span>
              <span className="text-[11px] text-muted-foreground/70 truncate leading-tight mt-0.5">
                {section.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
