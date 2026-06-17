"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface FormJadwalKontenProps {
  form: UseFormReturn<any>;
  name: string;
}

export function FormJadwalKonten({ form, name }: FormJadwalKontenProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel className="flex items-center gap-2 font-semibold">
            <Calendar className="size-4 text-primary" />
            Waktu Posting Konten
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="datetime-local"
                {...field}
                className="bg-muted/50 focus-visible:ring-primary/50"
              />
            </div>
          </FormControl>
          <FormDescription className="text-[11px] text-muted-foreground">
            Tentukan tanggal dan waktu kapan postingan ini akan secara otomatis dipublikasikan ke platform tujuan.
          </FormDescription>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}
