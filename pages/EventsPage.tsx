"use client";

import React from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { AnimatedText } from "@/components/atoms/AnimatedText";

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
       <LandingNavbar />
       
       <main className="flex-1 pt-32 pb-24 container mx-auto px-6">
         <AnimatedText as="h1" text="KEGIATAN & EVENT" className="text-4xl md:text-6xl font-title font-bold mb-8" />
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 opacity-0 animate-[fadeIn_1s_ease_0.5s_forwards]">
            <p className="font-body text-muted-foreground">Belum ada event mendatang saat ini.</p>
         </div>
       </main>
       
       <LandingFooter />
    </div>
  );
}
