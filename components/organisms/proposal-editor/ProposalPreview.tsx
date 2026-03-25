"use client";

import React from "react";
import type { ProposalData, ProposalSectionId } from "@/lib/types/proposal-template.types";
import { PROPOSAL_SECTIONS } from "@/lib/constants/proposal-templates";
import { cn } from "@/lib/utils";
import {
  FiTarget,
  FiUsers,
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiGlobe,
  FiSmartphone,
  FiCalendar,
  FiMap,
  FiAward,
  FiCheckCircle,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";

interface ProposalPreviewProps {
  data: ProposalData;
  activeSection: ProposalSectionId;
  docPadding?: number;
}

const A4_W = 794;
const A4_H = 1123;

export function ProposalPreview({ data, activeSection, docPadding = 56 }: ProposalPreviewProps) {
  const s = data.styling;
  const fontLink = `https://fonts.googleapis.com/css2?family=${s.bodyStyle.fontFamily.replace(/ /g, "+")}:wght@300;400;500;600;700&family=${s.headingStyle.fontFamily.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`;

  const headingFont = `'${s.headingStyle.fontFamily}', serif`;
  const bodyFont = `'${s.bodyStyle.fontFamily}', sans-serif`;

  return (
    <div className="flex flex-col items-center gap-8 py-6 px-6">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontLink} />

      {/* ═══════ COVER PAGE ═══════ */}
      <A4Page bg={s.coverPageStyle.backgroundGradient || s.accentColor} isActive={activeSection === "latar_belakang"}>
        <div className="relative h-full flex flex-col" style={{ color: "#fff" }}>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full opacity-[0.08]" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-[250px] h-[250px] rounded-full opacity-[0.06]" style={{ background: "#fff", transform: "translate(-30%, 30%)" }} />
          <div className="absolute top-[40%] right-[10%] w-[100px] h-[100px] rounded-full opacity-[0.05]" style={{ background: "#fff" }} />

          {data.headerImage && (
            <img src={data.headerImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-15 rounded" />
          )}

          <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center" style={{ padding: `80px ${docPadding}px` }}>
            {data.logoUrl && (
              <img src={data.logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-8 rounded-2xl bg-white/90 p-2.5 shadow-xl" />
            )}
            <p className="text-xs tracking-[6px] uppercase opacity-70 mb-4" style={{ fontFamily: bodyFont }}>
              Dokumen Resmi
            </p>
            <h1 className="text-[42px] font-bold leading-[1.1] tracking-tight mb-4" style={{ fontFamily: headingFont }}>
              Proposal<br />Sponsorship
            </h1>
            <div className="w-16 h-[3px] bg-white/50 rounded-full mb-6" />
            <p className="text-lg opacity-80 tracking-wide" style={{ fontFamily: bodyFont }}>
              Karang Taruna Mojosongo
            </p>
            <p className="text-xs opacity-50 mt-2 tracking-wider">2026</p>
          </div>

          <div className="relative z-10 px-16 pb-10 text-center text-[9px] opacity-40">
            Dokumen ini bersifat rahasia dan ditujukan hanya untuk pihak yang berkepentingan.
          </div>
        </div>
      </A4Page>

      {/* ═══════ PAGE 01: LATAR BELAKANG ═══════ */}
      <A4Page bg={s.pageStyles[0]?.backgroundColor} isActive={activeSection === "latar_belakang"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="01" accent={s.accentColor} />
          <SectionHeading title="Latar Belakang" font={headingFont} style={s.headingStyle} accent={s.accentColor} />
          {data.images.latar_belakang && (
            <img src={data.images.latar_belakang} alt="" className="w-full h-48 object-cover rounded-xl mb-6" />
          )}
          <p className="whitespace-pre-line leading-relaxed">{data.latarBelakang || "..."}</p>
        </div>
      </A4Page>

      {/* ═══════ PAGE 02: TUJUAN & MANFAAT ═══════ */}
      <A4Page bg={s.pageStyles[1]?.backgroundColor} isActive={activeSection === "tujuan_manfaat"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="02" accent={s.accentColor} />
          <SectionHeading title="Tujuan dan Manfaat" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          <div className="grid grid-cols-2 gap-6 mt-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accentColor }}>
                  <FiTarget className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[11px]" style={{ color: s.accentColor }}>Tujuan Acara</span>
              </div>
              <ul className="space-y-2.5">
                {(data.tujuanAcara.length > 0 ? data.tujuanAcara : ["..."]).map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiCheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: s.accentColor }} />
                    <span className="text-[10px] leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.accentColor }}>
                  <FiAward className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[11px]" style={{ color: s.accentColor }}>Manfaat bagi Sponsor</span>
              </div>
              <ul className="space-y-2.5">
                {(data.manfaatSponsor.length > 0 ? data.manfaatSponsor : ["..."]).map((m, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <FiArrowRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: s.accentColor }} />
                    <span className="text-[10px] leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </A4Page>

      {/* ═══════ PAGE 03: DESKRIPSI ACARA ═══════ */}
      <A4Page bg={s.pageStyles[2]?.backgroundColor} isActive={activeSection === "deskripsi_acara"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="03" accent={s.accentColor} />
          <SectionHeading title="Deskripsi Acara" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: <FiCalendar />, label: "Tema", value: data.deskripsiAcara.tema },
              { icon: <FiGlobe />, label: "Bentuk", value: data.deskripsiAcara.bentukKegiatan },
              { icon: <FiCalendar />, label: "Jadwal", value: data.deskripsiAcara.jadwal },
              { icon: <FiUsers />, label: "Target Peserta", value: data.deskripsiAcara.jumlahPeserta ? `${data.deskripsiAcara.jumlahPeserta} orang` : "" },
            ].filter((item) => item.value).map((item, i) => (
              <div key={i} className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: `${s.accentColor}0a` }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: s.accentColor }}>
                  <span className="text-white text-[10px]">{item.icon}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: s.accentColor }}>{item.label}</span>
                  <span className="text-[10px]">{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          {data.images.deskripsi_acara && (
            <img src={data.images.deskripsi_acara} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
          )}
          <p className="whitespace-pre-line leading-relaxed text-[10px]">{data.deskripsiAcara.detail || "..."}</p>
        </div>
      </A4Page>

      {/* ═══════ PAGE 04: PROFIL PESERTA ═══════ */}
      <A4Page bg={s.pageStyles[3]?.backgroundColor} isActive={activeSection === "profil_peserta"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="04" accent={s.accentColor} />
          <SectionHeading title="Profil Peserta & Target Audiens" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon: <FiUsers />, label: "Usia", value: data.profilPeserta.usia },
              { icon: <FiUser />, label: "Gender", value: data.profilPeserta.gender },
              { icon: <FiTarget />, label: "Profesi", value: data.profilPeserta.profesi },
              { icon: <FiMap />, label: "Lokasi", value: data.profilPeserta.lokasi },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: `${s.accentColor}0a` }}>
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: s.accentColor }}>
                  <span className="text-white text-[10px]">{item.icon}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: s.accentColor }}>{item.label}</span>
                  <span className="text-[10px]">{item.value || "—"}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="whitespace-pre-line leading-relaxed text-[10px]">{data.profilPeserta.narasi || "..."}</p>
        </div>
      </A4Page>

      {/* ═══════ PAGE 05: DATA PENDUKUNG ═══════ */}
      <A4Page bg={s.pageStyles[4]?.backgroundColor} isActive={activeSection === "data_pendukung"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="05" accent={s.accentColor} />
          <SectionHeading title="Data Pendukung" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          {data.dataPendukung.narasi && (
            <p className="text-[10px] leading-relaxed mb-5">{data.dataPendukung.narasi}</p>
          )}

          {/* Statistik Grid */}
          {data.dataPendukung.statistik.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {data.dataPendukung.statistik.map((stat, i) => {
                const icons = [FiUsers, FiSmartphone, FiTrendingUp, FiDollarSign, FiGlobe, FiCalendar];
                const Icon = icons[i % icons.length];
                return (
                  <div key={i} className="rounded-xl p-4 text-center" style={{ backgroundColor: `${s.accentColor}0d` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: s.accentColor }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: s.accentColor }}>{stat.value}</p>
                    <p className="text-[8px] text-gray-500 mt-1 leading-tight">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trend */}
          {data.dataPendukung.trendPopuler.length > 0 && (
            <div className="space-y-3">
              <p className="font-bold text-[11px] flex items-center gap-2" style={{ color: s.accentColor }}>
                <FiTrendingUp className="w-3.5 h-3.5" /> Trend Populer di Wilayah
              </p>
              {data.dataPendukung.trendPopuler.map((trend, i) => (
                <div key={i} className="rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: `${s.accentColor}08` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[9px] font-bold" style={{ backgroundColor: s.accentColor }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-[10px]">{trend.judul}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-relaxed">{trend.deskripsi}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.dataPendukung.sumberData && (
            <p className="text-[8px] text-gray-400 mt-6 italic">Sumber: {data.dataPendukung.sumberData}</p>
          )}
        </div>
      </A4Page>

      {/* ═══════ PAGE 06: ANGGARAN DANA ═══════ */}
      <A4Page bg={s.pageStyles[5]?.backgroundColor} isActive={activeSection === "anggaran_dana"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="06" accent={s.accentColor} />
          <SectionHeading title="Anggaran Dana" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          <div className="rounded-2xl p-5 text-center mb-6" style={{ background: `linear-gradient(135deg, ${s.accentColor}, ${s.accentColor}cc)` }}>
            <p className="text-[9px] text-white/70 uppercase tracking-widest mb-1">Total Anggaran</p>
            <p className="text-2xl font-bold text-white">{data.anggaranDana.totalAnggaran || "..."}</p>
          </div>

          {data.anggaranDana.alokasi.length > 0 && (
            <div className="space-y-2">
              {data.anggaranDana.alokasi.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ backgroundColor: `${s.accentColor}06` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: s.accentColor }}>
                    {a.persentase}%
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[10px]">{a.kategori}</p>
                    <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${s.accentColor}15` }}>
                      <div className="h-full rounded-full" style={{ width: `${a.persentase}%`, backgroundColor: s.accentColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </A4Page>

      {/* ═══════ PAGE 07: STRUKTUR PANITIA ═══════ */}
      <A4Page bg={s.pageStyles[6]?.backgroundColor} isActive={activeSection === "struktur_panitia"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="07" accent={s.accentColor} />
          <SectionHeading title="Struktur Panitia" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          {data.strukturPanitia.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.strukturPanitia.map((p, i) => (
                <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: `${s.accentColor}08` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0" style={{ backgroundColor: i === 0 ? s.accentColor : `${s.accentColor}80` }}>
                    {p.nama.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[10px]">{p.nama}</p>
                    <p className="text-[9px] opacity-60">{p.posisi}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-[10px]">Belum ada data.</p>
          )}
        </div>
      </A4Page>

      {/* ═══════ PAGE 08: PAKET SPONSORSHIP ═══════ */}
      <A4Page bg={s.pageStyles[7]?.backgroundColor} isActive={activeSection === "paket_sponsorship"}>
        <div style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="08" accent={s.accentColor} />
          <SectionHeading title="Paket Sponsorship" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          {data.images.paket_sponsorship && (
            <img src={data.images.paket_sponsorship} alt="" className="w-full h-32 object-cover rounded-xl mb-5" />
          )}

          {data.paketSponsorship.length > 0 ? (
            <div className="space-y-4">
              {data.paketSponsorship.map((pkg, i) => {
                const hColor = pkg.headerColor || s.accentColor;
                return (
                  <div key={i} className="rounded-2xl overflow-hidden shadow-sm" style={{ border: `1px solid ${hColor}30` }}>
                    <div className="relative px-5 py-4 overflow-hidden" style={{ background: `linear-gradient(135deg, ${hColor}, ${hColor}bb)` }}>
                      {pkg.headerBgImage && (
                        <img src={pkg.headerBgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <p className="text-white/70 text-[8px] uppercase tracking-widest">Paket</p>
                          <p className="text-white font-bold text-[14px]">{pkg.nama}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/70 text-[8px] uppercase tracking-widest">Investasi</p>
                          <p className="text-white font-bold text-[13px]">{pkg.nilai}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4 space-y-2">
                      {pkg.benefits.map((b, j) => (
                        <div key={j} className="flex items-start gap-2 text-[10px]">
                          <FiCheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: hColor }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 italic text-[10px]">Belum ada paket.</p>
          )}
        </div>
      </A4Page>

      {/* ═══════ PAGE 09: PENUTUP & KONTAK ═══════ */}
      <A4Page bg={s.pageStyles[8]?.backgroundColor} isActive={activeSection === "penutup_kontak"}>
        <div className="flex flex-col h-full" style={{ padding: `${docPadding}px`, fontFamily: bodyFont, fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color }}>
          <PageNumber num="09" accent={s.accentColor} />
          <SectionHeading title="Penutup" font={headingFont} style={s.headingStyle} accent={s.accentColor} />

          <p className="whitespace-pre-line leading-relaxed mb-8 flex-1">{data.penutupKontak.penutup || "..."}</p>

          {(data.penutupKontak.namaKontak || data.penutupKontak.telepon || data.penutupKontak.email) && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${s.accentColor}20` }}>
              <div className="px-5 py-3" style={{ backgroundColor: s.accentColor }}>
                <p className="text-white font-bold text-[12px]">Informasi Kontak</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                {data.penutupKontak.namaKontak && (
                  <div className="flex items-center gap-3 text-[10px]">
                    <FiUser className="w-4 h-4" style={{ color: s.accentColor }} />
                    <div><span className="font-bold block text-[8px] uppercase tracking-wider" style={{ color: s.accentColor }}>Nama</span>{data.penutupKontak.namaKontak}</div>
                  </div>
                )}
                {data.penutupKontak.telepon && (
                  <div className="flex items-center gap-3 text-[10px]">
                    <FiPhone className="w-4 h-4" style={{ color: s.accentColor }} />
                    <div><span className="font-bold block text-[8px] uppercase tracking-wider" style={{ color: s.accentColor }}>Telepon</span>{data.penutupKontak.telepon}</div>
                  </div>
                )}
                {data.penutupKontak.email && (
                  <div className="flex items-center gap-3 text-[10px]">
                    <FiMail className="w-4 h-4" style={{ color: s.accentColor }} />
                    <div><span className="font-bold block text-[8px] uppercase tracking-wider" style={{ color: s.accentColor }}>Email</span>{data.penutupKontak.email}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </A4Page>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function A4Page({ children, bg, isActive }: { children: React.ReactNode; bg?: string; isActive: boolean }) {
  return (
    <div
      className={cn(
        "relative shadow-2xl rounded-sm origin-top scale-[0.62] xl:scale-[0.70] transition-all",
        isActive && "ring-3 ring-blue-400/50 ring-offset-4"
      )}
      style={{ width: A4_W, minHeight: A4_H, background: bg || "#ffffff" }}
    >
      {children}
    </div>
  );
}

function PageNumber({ num, accent }: { num: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[40px] font-black leading-none opacity-10" style={{ color: accent }}>{num}</span>
      <div className="h-px flex-1" style={{ backgroundColor: `${accent}20` }} />
    </div>
  );
}

function SectionHeading({ title, font, style, accent }: { title: string; font: string; style: ProposalData["styling"]["headingStyle"]; accent: string }) {
  return (
    <div className="mb-5">
      <h2
        className="text-xl font-bold"
        style={{
          fontFamily: font,
          fontSize: `${style.fontSize + 4}px`,
          fontWeight: style.fontWeight,
          color: style.color,
        }}
      >
        {title}
      </h2>
      <div className="w-12 h-[3px] rounded-full mt-2" style={{ backgroundColor: accent, opacity: 0.5 }} />
    </div>
  );
}
