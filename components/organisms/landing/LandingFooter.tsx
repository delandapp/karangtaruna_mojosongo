"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import { Mail, MapPin, Instagram, Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { FaTiktok } from "react-icons/fa";

const FOOTER_NAV = [
  {
    title: "Navigasi",
    links: [
      { label: "Beranda", href: "/#hero" },
      { label: "Galeri Dokumentasi", href: "/#galeri" },
      { label: "Media Partner", href: "/#mitra" },
      { label: "Program Kerja", href: "/#fitur" },
      { label: "Kabar Berita", href: "/berita" },
    ],
  },
  {
    title: "Kemitraan & Bisnis",
    links: [
      { label: "Halaman Sponsorship", href: "/sponsorship" },
      { label: "Paket & Benefit Sponsor", href: "/sponsorship#paket" },
      { label: "Data Demografi Mojosongo", href: "/sponsorship#demografi" },
      { label: "Jaringan 14 Media Partner", href: "/sponsorship#media-partner" },
      { label: "Hubungi Koordinator", href: "/sponsorship#kontak" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    icon: Instagram,
    href: "https://instagram.com/karangtaruna.mojosongo",
    label: "Instagram @karangtaruna.mojosongo",
    handle: "@karangtaruna.mojosongo",
  },
  {
    icon: FaTiktok,
    href: "https://tiktok.com/@karangtaruna.mojosongo",
    label: "TikTok @karangtaruna.mojosongo",
    handle: "@karangtaruna.mojosongo",
  },
];

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-n-950/80 backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="inline-block w-fit">
              <Logo variant="with-text" size={44} />
            </Link>

            <p className="text-slate-600 dark:text-slate-400 font-sans text-sm leading-relaxed max-w-sm">
              Karang Taruna Kelurahan Mojosongo — wadah akselerasi potensi generasi muda,
              pelestarian budaya adiluhung, dan kolaborasi sinergis antar pemuda di Surakarta.
            </p>

            {/* Official Handles */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Akun Resmi Media Sosial
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 shadow-sm transition-all duration-200 hover:scale-105"
                  >
                    <s.icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                Kelurahan Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127
              </span>
              <a
                href="mailto:karangtarunamojosongo@gmail.com"
                className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
              >
                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                karangtarunamojosongo@gmail.com
              </a>
              <a
                href="https://wa.me/6282327077569"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-emerald-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                +62 823-2707-7569 (WhatsApp)
              </a>
            </div>
          </div>

          {/* Nav Links (2 cols) */}
          {FOOTER_NAV.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-slate-600 dark:text-slate-400 text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Callout Card (1 col) */}
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                Ingin Brand Anda Menjangkau 55.000+ Warga?
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bergabunglah sebagai mitra sponsor resmi kegiatan pemuda & budaya Mojosongo.
              </p>
              <Link
                href="/sponsorship"
                className="inline-flex items-center justify-between px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all group"
              >
                <span>Lihat Proposal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {currentYear} Karang Taruna Kelurahan Mojosongo. Hak Cipta Dilindungi.</p>
          <div className="flex items-center gap-6">
            <Link href="/sponsorship" className="hover:text-emerald-600 transition-colors">
              Proposal Sponsorship
            </Link>
            <Link href="/#mitra" className="hover:text-emerald-600 transition-colors">
              Media Partner
            </Link>
            <span>Surakarta, Jawa Tengah</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
