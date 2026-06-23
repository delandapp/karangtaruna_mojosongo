import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DAFTAR_TEMA } from "@/lib/tema-linktree";
import { LinkButton, LinkIcon } from "./LinkButton";

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

  // Render Background Styles
  const isGradient = themeConfig.warna_latar.startsWith("linear-gradient");
  const mainBgStyle: React.CSSProperties = {
    fontFamily: `"${themeConfig.font}", sans-serif`,
    color: themeConfig.warna_teks,
  };

  if (linktree.bg_image_url) {
    mainBgStyle.backgroundImage = `url(${linktree.bg_image_url})`;
    mainBgStyle.backgroundSize = "cover";
    mainBgStyle.backgroundPosition = "center";
    mainBgStyle.backgroundRepeat = "no-repeat";
  } else if (isGradient) {
    mainBgStyle.backgroundImage = themeConfig.warna_latar;
  } else {
    mainBgStyle.backgroundColor = themeConfig.warna_latar;
  }

  // Get social media items list
  const socialMedias = [
    { key: "sosmed_instagram", icon: "FaInstagram", url: linktree.sosmed_instagram, prefix: "https://instagram.com/" },
    { key: "sosmed_tiktok", icon: "FaTiktok", url: linktree.sosmed_tiktok, prefix: "https://tiktok.com/@" },
    { key: "sosmed_whatsapp", icon: "FaWhatsapp", url: linktree.sosmed_whatsapp, prefix: "https://wa.me/" },
    { key: "sosmed_facebook", icon: "FaFacebook", url: linktree.sosmed_facebook, prefix: "https://facebook.com/" },
    { key: "sosmed_youtube", icon: "FaYoutube", url: linktree.sosmed_youtube, prefix: "https://youtube.com/" },
    { key: "sosmed_github", icon: "FaGithub", url: linktree.sosmed_github, prefix: "https://github.com/" },
    { key: "sosmed_email", icon: "FaEnvelope", url: linktree.sosmed_email, prefix: "mailto:" },
    { key: "sosmed_telepon", icon: "FaPhone", url: linktree.sosmed_telepon, prefix: "tel:" },
  ].filter((item) => !!item.url);

  // Compile animations keyframe styles
  const animationCssStyles = `
    @keyframes custom-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @keyframes custom-wobble {
      0%, 100% { transform: translateX(0); }
      15%, 45%, 75% { transform: translateX(-3px); }
      30%, 60%, 90% { transform: translateX(3px); }
    }
    @keyframes custom-glow {
      0%, 100% { box-shadow: 0 0 5px var(--glow-color, rgba(255,255,255,0.4)); }
      50% { box-shadow: 0 0 20px var(--glow-color, rgba(255,255,255,0.8)); }
    }
    .anim-float { animation: custom-float 3s ease-in-out infinite; }
    .anim-wobble { animation: custom-wobble 1.5s ease-in-out infinite; }
    .anim-glow { animation: custom-glow 2s ease-in-out infinite; }
  `;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between px-6 py-12 select-none relative"
      style={mainBgStyle}
    >
      {/* Background Image Glass Overlay (Optional) */}
      {linktree.bg_image_url && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] z-0 pointer-events-none" />
      )}

      {/* Dynamic Font Loader & Animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=${themeConfig.font.replace(/\s+/g, "+")}:wght@400;600;700&display=swap');
            ${animationCssStyles}
          `,
        }}
      />

      <div className="w-full max-w-lg flex flex-col items-center gap-8 pt-4 z-10">
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
            <h1 className="text-xl font-bold tracking-tight" style={{ color: linktree.bg_image_url ? "#FFFFFF" : undefined }}>
              {linktree.judul}
            </h1>
            {linktree.bio && (
              <p
                className="text-sm font-medium leading-relaxed max-w-sm"
                style={{ color: linktree.bg_image_url ? "#E5E7EB" : themeConfig.warna_teks_sekunder }}
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
              linktree={linktree}
              themeConfig={themeConfig}
            />
          ))}
        </div>
      </div>

      {/* Social Media Footer Section */}
      <div className="w-full max-w-sm flex flex-col items-center gap-6 mt-12 z-10">
        {socialMedias.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {socialMedias.map((item) => {
              const fullUrl = item.url!.startsWith("http") || item.url!.includes("@") || item.key === "sosmed_email" || item.key === "sosmed_telepon"
                ? item.url!
                : `${item.prefix}${item.url}`;

              return (
                <a
                  key={item.key}
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-9 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 hover:scale-110 flex items-center justify-center text-white transition-all shadow-xs"
                  style={{
                    color: linktree.bg_image_url ? "#FFFFFF" : themeConfig.warna_teks,
                    borderColor: linktree.bg_image_url ? "rgba(255,255,255,0.2)" : `${themeConfig.warna_teks}33`,
                  }}
                  title={item.key.replace("sosmed_", "")}
                >
                  <LinkIcon name={item.icon} className="size-4" />
                </a>
              );
            })}
          </div>
        )}

        {/* Footer Branding */}
        <div className="text-[10px] opacity-40 font-mono tracking-widest text-center">
          POWERED BY MOJOSONGO
        </div>
      </div>
    </div>
  );
}
