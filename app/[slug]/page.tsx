import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DAFTAR_TEMA } from "@/lib/tema-linktree";
import { LinkButton } from "./LinkButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ──────────────────────────────────────────────────────────
// SEO Metadata Generator
// ──────────────────────────────────────────────────────────
export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const linktree = await prisma.m_linktree.findFirst({
    where: {
      slug: params.slug.toLowerCase().trim(),
      aktif: true,
      dihapus_pada: null,
    },
  });

  if (!linktree) return {};

  return {
    title: linktree.meta_judul || linktree.judul,
    description: linktree.meta_deskripsi || linktree.bio || `Tautan profil resmi ${linktree.judul}`,
    openGraph: {
      title: linktree.meta_judul || linktree.judul,
      description: linktree.meta_deskripsi || linktree.bio || "",
      images: linktree.foto_profil_url ? [{ url: linktree.foto_profil_url }] : [],
    },
  };
}

export default async function PublicLinktreePage(props: PageProps) {
  const params = await props.params;
  const slug = params.slug.toLowerCase().trim();

  // Fetch Linktree & Links
  const linktree = await prisma.m_linktree.findFirst({
    where: {
      slug,
      aktif: true,
      dihapus_pada: null,
    },
    include: {
      links: {
        where: {
          aktif: true,
          dihapus_pada: null,
        },
        orderBy: {
          urutan: "asc",
        },
      },
    },
  });

  if (!linktree) {
    return notFound();
  }

  // Extract request info for tracking
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const referer = headersList.get("referer") || "";
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "";

  // Device detection
  let perangkat = "desktop";
  if (userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      perangkat = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      perangkat = "tablet";
    }
  }

  // Log page view asynchronously
  prisma.c_klik_linktree
    .create({
      data: {
        linktree_id: linktree.id,
        link_id: null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        referer: referer || null,
        perangkat,
      },
    })
    .catch((err) => console.error("Error logging page view:", err));

  // Theme configuration lookup
  const baseTheme = DAFTAR_TEMA.find((t) => t.kode === linktree.tema) || DAFTAR_TEMA[0];

  // Apply overrides if customized
  const themeConfig = {
    ...baseTheme,
    warna_latar: linktree.warna_latar || baseTheme.latar,
    warna_primer: linktree.warna_primer || baseTheme.warna_primer,
    font: linktree.font_kustom || baseTheme.font,
  };

  // Check if background is gradient
  const isGradient = themeConfig.warna_latar.startsWith("linear-gradient");

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-12 select-none relative overflow-hidden"
      style={{
        fontFamily: `"${themeConfig.font}", sans-serif`,
        color: themeConfig.warna_teks,
        background: isGradient ? undefined : themeConfig.warna_latar,
        backgroundImage: isGradient ? themeConfig.warna_latar : undefined,
      }}
    >
      {/* Dynamic Font Loader from Google Fonts */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=${themeConfig.font.replace(
            /\s+/g,
            "+"
          )}:wght@400;600;700&display=swap');`,
        }}
      />

      <div className="w-full max-w-lg flex flex-col items-center gap-8 pt-4">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center gap-4">
          {linktree.foto_profil_url ? (
            <div className="size-20 rounded-full border border-white/20 overflow-hidden shadow-md">
              <img
                src={linktree.foto_profil_url}
                alt={linktree.judul}
                className="object-cover size-full"
              />
            </div>
          ) : (
            <div className="size-20 rounded-full bg-zinc-800 text-white flex items-center justify-center font-bold text-xl border border-white/10 shadow-md">
              {linktree.judul.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">{linktree.judul}</h1>
            {linktree.bio && (
              <p
                className="text-sm font-medium leading-relaxed max-w-sm"
                style={{ color: themeConfig.warna_teks_sekunder }}
              >
                {linktree.bio}
              </p>
            )}
          </div>
        </div>

        {/* Links Grid */}
        <div className="w-full flex flex-col items-center gap-3">
          {linktree.links.map((link) => (
            <LinkButton
              key={link.id}
              link={link}
              linktreeId={linktree.id}
              themeConfig={themeConfig}
            />
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-12 text-[10px] opacity-40 font-mono tracking-widest text-center">
        POWERED BY MOJOSONGO
      </div>
    </div>
  );
}
