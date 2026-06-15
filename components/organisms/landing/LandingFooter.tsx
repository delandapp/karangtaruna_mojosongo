"use client";

import React from "react";
import Link from "next/link";
import Logo from "@/components/atoms/Logo";
import { Mail, MapPin, Phone, Instagram, Youtube, Facebook } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Navigasi",
    links: [
      { label: "Beranda", href: "/" },
      { label: "Galeri Kegiatan", href: "/galeri" },
      { label: "Program", href: "/#program" },
    ],
  },
  {
    title: "Tentang",
    links: [
      { label: "Profil Organisasi", href: "/tentang" },
      { label: "Kepengurusan", href: "/tentang#kepengurusan" },
      { label: "Bergabung", href: "/#cta" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube,   href: "https://youtube.com",   label: "YouTube" },
  { icon: Facebook,  href: "https://facebook.com",  label: "Facebook" },
];

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-n-50 dark:bg-n-900">
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Logo variant="with-text" size={36} />
            <p className="text-n-500 dark:text-n-400 font-body text-sm leading-relaxed max-w-sm">
              Karang Taruna Kelurahan Mojosongo — wadah pengembangan potensi generasi
              muda untuk membangun lingkungan yang lebih baik.
            </p>

            {/* Contact Info */}
            <div className="flex flex-col gap-2.5 text-sm font-ui text-n-600 dark:text-n-400">
              <a href="mailto:karangtarunamojosongo@gmail.com" className="flex items-center gap-2.5 hover:text-primary-500 transition-colors">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                karangtarunamojosongo@gmail.com
              </a>
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                Kelurahan Mojosongo, Kec. Jebres, Surakarta
              </span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-1">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-n-200 dark:bg-n-700 flex items-center justify-center text-n-600 dark:text-n-400 hover:bg-primary-500 hover:text-white transition-all duration-200 hover:scale-110"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Links Columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <h4 className="text-n-900 dark:text-n-50 font-title font-semibold text-sm uppercase tracking-widest">
                {col.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-n-500 dark:text-n-400 font-ui text-sm hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-ui text-n-400">
          <span>
            © {currentYear} Karang Taruna Kelurahan Mojosongo. Hak cipta dilindungi.
          </span>
          <span>Dibangun dengan ❤️ untuk warga Mojosongo</span>
        </div>
      </div>
    </footer>
  );
}
