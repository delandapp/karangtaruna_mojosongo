"use client";

import React from "react";
import * as FaIcons from "react-icons/fa6";

export function LinkIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (FaIcons as any)[name];
  if (!IconComponent) return <FaIcons.FaGlobe className={className} style={style} />;
  return <IconComponent className={className} style={style} />;
}

interface LinkButtonProps {
  link: {
    id: number;
    judul: string;
    url: string;
    ikon: string | null;
    warna_ikon: string | null;
  };
  linktreeId: number;
  themeConfig: {
    warna_tombol_latar: string;
    warna_tombol_teks: string;
    warna_tombol_border: string;
    border_radius_tombol: string;
    font: string;
    gaya_tombol: "solid" | "outline" | "ghost" | "glass";
    backdrop_blur?: boolean;
  };
}

export function LinkButton({ link, linktreeId, themeConfig }: LinkButtonProps) {
  const handleClick = async () => {
    try {
      await fetch("/api/linktree/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linktreeId, linkId: link.id }),
      });
    } catch (err) {
      console.error("Tracking error:", err);
    }
  };

  const solid = themeConfig.gaya_tombol === "solid";
  const outline = themeConfig.gaya_tombol === "outline";
  const glass = themeConfig.gaya_tombol === "glass";

  const linkStyle: React.CSSProperties = {
    borderRadius: themeConfig.border_radius_tombol,
    color: themeConfig.warna_tombol_teks,
  };

  if (solid) {
    linkStyle.backgroundColor = themeConfig.warna_tombol_latar;
    linkStyle.borderColor = themeConfig.warna_tombol_border;
  } else if (outline) {
    linkStyle.borderWidth = "1px";
    linkStyle.borderColor = themeConfig.warna_tombol_border;
    linkStyle.backgroundColor = "transparent";
  } else if (glass) {
    linkStyle.backgroundColor = themeConfig.warna_tombol_latar;
    linkStyle.borderWidth = "1px";
    linkStyle.borderColor = themeConfig.warna_tombol_border;
    if (themeConfig.backdrop_blur) {
      linkStyle.backdropFilter = "blur(8px)";
    }
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={linkStyle}
      className="w-full max-w-lg py-3.5 px-6 font-semibold flex items-center justify-between gap-3 shadow-xs hover:scale-101 border border-transparent transition-all duration-200 cursor-pointer"
    >
      <div className="size-5 flex items-center justify-center shrink-0">
        <LinkIcon name={link.ikon || "FaGlobe"} className="size-4" style={{ color: link.warna_ikon || undefined }} />
      </div>
      <span className="truncate flex-1 text-center pr-6 text-sm">{link.judul}</span>
    </a>
  );
}
