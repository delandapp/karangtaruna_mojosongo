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
    warna_latar: string | null;
    warna_teks: string | null;
    warna_border: string | null;
    animasi: string | null;
  };
  linktree: {
    id: number;
    gaya_tombol: string | null;
    animasi_tombol: string | null;
    warna_tombol_latar: string | null;
    warna_tombol_teks: string | null;
    warna_tombol_border: string | null;
    border_radius_tombol: string | null;
  };
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

export function LinkButton({ link, linktree, themeConfig }: LinkButtonProps) {
  const handleClick = async () => {
    try {
      await fetch("/api/linktree/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linktreeId: linktree.id, linkId: link.id }),
      });
    } catch (err) {
      console.error("Tracking error:", err);
    }
  };

  // ── Styling Overrides ──────────────────────────────────────────────────────
  const gayaTombol = linktree.gaya_tombol || themeConfig.gaya_tombol || "solid";
  const warnaLatar = link.warna_latar || linktree.warna_tombol_latar || themeConfig.warna_tombol_latar;
  const warnaTeks = link.warna_teks || linktree.warna_tombol_teks || themeConfig.warna_tombol_teks;
  const warnaBorder = link.warna_border || linktree.warna_tombol_border || themeConfig.warna_tombol_border;
  const rawRadius = linktree.border_radius_tombol || themeConfig.border_radius_tombol;
  const animasi = link.animasi || linktree.animasi_tombol || "none";

  // Map radius aliases to standard values
  let borderRadius = rawRadius;
  if (rawRadius === "rounded-none") borderRadius = "0px";
  if (rawRadius === "rounded-sm") borderRadius = "0.125rem";
  if (rawRadius === "rounded-md") borderRadius = "0.375rem";
  if (rawRadius === "rounded-lg") borderRadius = "0.5rem";
  if (rawRadius === "rounded-xl") borderRadius = "0.75rem";
  if (rawRadius === "rounded-full") borderRadius = "9999px";

  const linkStyle: React.CSSProperties = {
    borderRadius: borderRadius,
    color: warnaTeks,
  };

  // Build styles based on button variant
  let variantClass = "";
  if (gayaTombol === "solid") {
    linkStyle.backgroundColor = warnaLatar;
    linkStyle.borderColor = warnaBorder;
    linkStyle.borderWidth = "1px";
  } else if (gayaTombol === "outline") {
    linkStyle.borderWidth = "1px";
    linkStyle.borderColor = warnaBorder;
    linkStyle.backgroundColor = "transparent";
  } else if (gayaTombol === "soft") {
    // Add opacity to background hex color if possible
    linkStyle.backgroundColor = `${warnaLatar}1A`; // 10% opacity hex
    linkStyle.color = warnaLatar; // text uses accent color
    linkStyle.borderColor = "transparent";
  } else if (gayaTombol === "ghost") {
    linkStyle.backgroundColor = "transparent";
    linkStyle.borderColor = "transparent";
  } else if (gayaTombol === "glass") {
    linkStyle.backgroundColor = `${warnaLatar}33`; // 20% opacity hex
    linkStyle.borderWidth = "1px";
    linkStyle.borderColor = warnaBorder;
    linkStyle.backdropFilter = "blur(8px)";
  } else if (gayaTombol === "brutalist") {
    linkStyle.backgroundColor = warnaLatar;
    linkStyle.borderColor = "#000000";
    linkStyle.borderWidth = "3px";
    linkStyle.boxShadow = "4px 4px 0px 0px #000000";
  } else if (gayaTombol === "brutalist-offset") {
    linkStyle.backgroundColor = warnaLatar;
    linkStyle.borderColor = warnaBorder;
    linkStyle.borderWidth = "3px";
    linkStyle.boxShadow = `4px 4px 0px 0px ${warnaBorder}`;
  } else if (gayaTombol === "double-border") {
    linkStyle.backgroundColor = warnaLatar;
    linkStyle.borderColor = warnaBorder;
    linkStyle.borderStyle = "double";
    linkStyle.borderWidth = "4px";
  } else if (gayaTombol === "shadow-offset") {
    linkStyle.backgroundColor = warnaLatar;
    linkStyle.borderColor = warnaBorder;
    linkStyle.borderWidth = "1px";
    variantClass = "shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200";
  }

  // Animation mappings
  let animClass = "";
  if (animasi === "pulse") animClass = "animate-pulse";
  else if (animasi === "bounce") animClass = "animate-bounce";
  else if (animasi === "float") animClass = "anim-float";
  else if (animasi === "wobble") animClass = "anim-wobble";
  else if (animasi === "glow") animClass = "anim-glow";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      style={linkStyle}
      className={`w-full max-w-lg py-3.5 px-6 font-semibold flex items-center justify-between gap-3 shadow-xs hover:scale-101 border transition-all duration-200 cursor-pointer ${variantClass} ${animClass}`}
    >
      <div className="size-5 flex items-center justify-center shrink-0">
        <LinkIcon name={link.ikon || "FaGlobe"} className="size-4" style={{ color: link.warna_ikon || undefined }} />
      </div>
      <span className="truncate flex-1 text-center pr-6 text-sm">{link.judul}</span>
    </a>
  );
}
