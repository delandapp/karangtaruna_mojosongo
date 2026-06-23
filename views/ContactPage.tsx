"use client";

import React from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { AnimatedText } from "@/components/atoms/AnimatedText";
import { MagneticButton } from "@/components/atoms/MagneticButton";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
       <LandingNavbar />
       
       <main className="flex-1 pt-32 pb-24 container mx-auto px-6 max-w-4xl flex flex-col items-center text-center">
         <AnimatedText as="h1" text="HUBUNGI KAMI" className="text-4xl md:text-6xl font-title font-bold mb-4" />
         <p className="text-muted-foreground font-body mb-12">Punya pertanyaan, ide kolaborasi, atau ingin bergabung?</p>
         
         <div className="w-full bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm text-left opacity-0 animate-[fadeIn_1s_ease_0.5s_forwards]">
            {/* Form Placeholder */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Nama Lengkap</label>
                <input type="text" className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Pesan</label>
                <textarea rows={4} className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Tulis pesan Anda disini..." />
              </div>
              <MagneticButton className="w-full mt-4" intensity={0.1}>
                 Kirim Pesan
              </MagneticButton>
            </div>
         </div>
       </main>
       
       <LandingFooter />
    </div>
  );
}
