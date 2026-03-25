"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Upload } from "lucide-react";

interface ImageUploaderProps {
  value?: string; // data URL
  onChange: (dataUrl: string | undefined) => void;
  label?: string;
  hint?: string;
  compact?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  label = "Upload Gambar",
  hint = "JPG, PNG, atau WebP (maks 2MB)",
  compact = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar (maks 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  if (value) {
    return (
      <div className="relative group">
        <img
          src={value}
          alt="Uploaded"
          className={`w-full object-cover rounded-lg border ${
            compact ? "h-20" : "h-32"
          }`}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="h-7 text-xs gap-1"
          >
            <Upload className="w-3 h-3" />
            Ganti
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onChange(undefined)}
            className="h-7 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            Hapus
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg cursor-pointer transition-colors
        hover:border-primary/50 hover:bg-primary/5
        flex flex-col items-center justify-center gap-1.5 text-muted-foreground
        ${compact ? "py-3 px-4" : "py-6 px-4"}
      `}
    >
      <ImagePlus className={compact ? "w-4 h-4" : "w-6 h-6"} />
      <span className={compact ? "text-[10px]" : "text-xs font-medium"}>
        {label}
      </span>
      {!compact && (
        <span className="text-[10px] text-muted-foreground/60">{hint}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
