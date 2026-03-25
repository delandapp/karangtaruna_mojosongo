"use client";

import React, { use} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProposalEditorApp } from "@/components/organisms/proposal-editor/ProposalEditorApp";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalEditorPage(props: PageProps) {
  const params = use(props.params);
  const eventId = parseInt(params.id, 10);
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") || undefined;

  if (isNaN(eventId)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">ID Event tidak valid.</p>
      </div>
    );
  }

  const handleBack = () => {
    router.push(`/dashboard/event/${eventId}?tab=sponsorship-generator`);
  };

  return (
    <ProposalEditorApp
      eventId={eventId}
      templateId={templateId}
      onBack={handleBack}
    />
  );
}
