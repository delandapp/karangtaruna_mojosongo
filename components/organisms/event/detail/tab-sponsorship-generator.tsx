"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProposalDocument } from "@/components/organisms/pdf/ProposalPDF";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TabSponsorshipGeneratorProps {
  eventId: number;
}

const steps = ["Pilih Template", "Pilih Tier", "Kustomisasi Benefit"];

export function TabSponsorshipGenerator({ eventId }: TabSponsorshipGeneratorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState("Platinum");
  const [benefits, setBenefits] = useState("1. Logo di backdrop utama\n2. Penyebutan oleh MC\n3. Stand promosi 3x3m\n4. Logo di tiket dan wristband");
  const [isGenerating, setIsGenerating] = useState(false);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 0, 0));

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      toast.loading("Mempersiapkan PDF...", { id: "pdf-gen" });

      const benefitsArray = benefits.split("\n").filter(b => b.trim() !== "");
      
      const blob = await pdf(
        <ProposalDocument tier={selectedTier} benefits={benefitsArray} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Proposal_Sponsorship_Event_${eventId}_${selectedTier}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Proposal berhasil di-generate!", { id: "pdf-gen" });
    } catch (err) {
      toast.error("Gagal men-generate PDF", { id: "pdf-gen" });
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 mt-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Generator Proposal (Event ID: {eventId})</h2>
        <p className="text-sm text-muted-foreground mt-1">Buat proposal sponsorship dan sesuaikan paket benefit.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:w-full before:bg-slate-200 before:-z-10">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 ${
                index <= currentStep
                  ? "bg-primary border-primary-foreground text-primary-foreground"
                  : "bg-slate-100 border-white text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-xs mt-2 font-medium ${index <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Pilih template proposal dasar dokumen PDF."}
            {currentStep === 1 && "Pilih paket sponsorship default (Platinum, Gold, Silver, Bronze)."}
            {currentStep === 2 && "Sesuaikan detail benefit yang akan diberikan ke pihak sponsor."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-primary rounded-lg p-4 cursor-pointer hover:bg-slate-50 relative overflow-hidden dark:hover:bg-slate-900">
                <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">Dipilih</div>
                <h3 className="font-semibold text-lg">Template Standar BUMN</h3>
                <p className="text-sm text-muted-foreground mt-2">Format resmi untuk pengajuan ke badan usaha milik negara.</p>
              </div>
              <div className="border-2 border-transparent rounded-lg p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 bg-slate-50 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                <h3 className="font-semibold text-lg">Template Kreatif/Event</h3>
                <p className="text-sm text-muted-foreground mt-2">Visual menarik khusus untuk event kepemudaan dan konser.</p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Platinum", color: "bg-slate-800 text-white dark:bg-slate-700", price: "Rp 50.000.000" },
                  { name: "Gold", color: "bg-yellow-500 text-slate-900", price: "Rp 30.000.000" },
                  { name: "Silver", color: "bg-slate-300 text-slate-800", price: "Rp 15.000.000" },
                  { name: "Bronze", color: "bg-amber-700 text-white", price: "Rp 5.000.000" },
                ].map((tier) => (
                  <div 
                    key={tier.name} 
                    onClick={() => setSelectedTier(tier.name)}
                    className={`p-4 rounded-lg cursor-pointer transition-transform hover:scale-105 ring-offset-2 ${selectedTier === tier.name ? "ring-2 ring-primary" : ""} ${tier.color}`}
                  >
                    <h3 className="font-bold text-xl">{tier.name}</h3>
                    <p className="mt-2 text-sm opacity-90">Mulai dari {tier.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="benefits">Daftar Benefit Khusus</Label>
                <Textarea 
                  id="benefits" 
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="1. Logo di backdrop utama&#10;2. Penyebutan oleh MC&#10;3. Stand promosi 3x3m" 
                  rows={6} 
                />
                <p className="text-xs text-muted-foreground">Tulis tiap benefit di baris baru.</p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || isGenerating}>
            Kembali
          </Button>
          <Button onClick={currentStep === steps.length - 1 ? handleGeneratePDF : nextStep} disabled={isGenerating}>
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {currentStep === steps.length - 1 ? "Generate Proposal (PDF)" : "Selanjutnya"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
