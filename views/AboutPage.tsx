"use client";

import React from "react";
import { LandingNavbar } from "@/components/organisms/landing/LandingNavbar";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";
import { AnimatedText } from "@/components/atoms/AnimatedText";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
       <LandingNavbar />
       
       <main className="flex-1 pt-32 pb-24 container mx-auto px-6">
         <AnimatedText as="h1" text="TENTANG KAMI" className="text-4xl md:text-6xl font-title font-bold mb-8" />
         
         <div className="prose dark:prose-invert lg:prose-xl font-body max-w-4xl opacity-0 animate-[fadeIn_1s_ease_1s_forwards]">
            <p>
              Karang Taruna Kelurahan Mojosongo didirikan sebagai wadah pengembangan generasi muda...
              (Konten selengkapnya akan ditambahkan kemudian)
            </p>
         </div>
       </main>
       
       <LandingFooter />
    </div>
  );
}
