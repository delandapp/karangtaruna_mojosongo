"use client";

import React, { useEffect } from "react";
import { Users } from "lucide-react";

export function TabPanitia({ onRegisterAdd }: { onRegisterAdd?: (fn: () => void) => void }) {
  useEffect(() => {
    if (onRegisterAdd) {
      onRegisterAdd(() => console.log("Add Panitia clicked (WIP)"));
    }
  }, [onRegisterAdd]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground bg-muted/20">
      <Users className="mb-4 h-12 w-12 opacity-20" />
      <h3 className="text-lg font-medium text-foreground">Susunan Panitia</h3>
      <p className="mt-1 text-sm">
        Fitur pengelolaan Susunan Panitia sedang dalam tahap pengembangan.
      </p>
    </div>
  );
}
