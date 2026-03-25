import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ProposalData, ProposalStyling } from "@/lib/types/proposal-template.types";

// =============================================================================
// HELPER — tint color using RGB mixing (no CSS opacity — react-pdf doesn't support it)
// =============================================================================
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}

function tint(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
}

// =============================================================================
// STYLES FACTORY
// =============================================================================
const pad = 50;

const createStyles = (s: ProposalStyling) =>
  StyleSheet.create({
    page: { flexDirection: "column" as const, backgroundColor: "#ffffff", padding: pad, fontFamily: "Helvetica", fontSize: s.bodyStyle.fontSize, lineHeight: 1.65, color: s.bodyStyle.color },
    coverPage: { flexDirection: "column" as const, backgroundColor: s.coverPageStyle.backgroundColor || "#ffffff", padding: 0, fontFamily: "Helvetica" },
    coverHeader: { backgroundColor: s.accentColor, padding: 60, paddingTop: 80, paddingBottom: 80, alignItems: "center" as const, justifyContent: "center" as const },
    coverTitle: { fontSize: 32, fontWeight: "bold", color: "#ffffff", letterSpacing: 5, textAlign: "center" as const },
    coverDivider: { width: 60, height: 2, backgroundColor: "rgba(255,255,255,0.4)", marginVertical: 14 },
    coverSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.75)", textAlign: "center" as const },
    coverBody: { padding: 50, flex: 1, justifyContent: "center" as const, alignItems: "center" as const },
    // Section
    pageNum: { fontSize: 36, fontWeight: "bold", color: tint(s.accentColor, 0.85), marginBottom: 4 },
    pageNumLine: { height: 1, flex: 1, backgroundColor: tint(s.accentColor, 0.9), marginLeft: 8 },
    sectionTitle: { fontSize: s.headingStyle.fontSize + 4, fontWeight: "bold", color: s.headingStyle.color, marginBottom: 4 },
    sectionDivider: { width: 40, height: 2.5, backgroundColor: s.accentColor, opacity: 0.45, borderRadius: 1, marginBottom: 14 },
    // Text
    paragraph: { fontSize: s.bodyStyle.fontSize, lineHeight: 1.65, marginBottom: 8 },
    subTitle: { fontSize: s.bodyStyle.fontSize + 1, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
    // List with bullet
    listItem: { flexDirection: "row" as const, marginBottom: 5, paddingLeft: 2 },
    listBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: s.accentColor, marginTop: 3, marginRight: 8 },
    listArrow: { width: 0, height: 0, borderTopWidth: 3, borderTopColor: "transparent", borderBottomWidth: 3, borderBottomColor: "transparent", borderLeftWidth: 5, borderLeftColor: s.accentColor, marginTop: 3, marginRight: 8 },
    listText: { flex: 1, fontSize: s.bodyStyle.fontSize, lineHeight: 1.5 },
    // Info card
    infoGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginBottom: 14 },
    infoCard: { width: "48%", backgroundColor: tint(s.accentColor, 0.93), borderRadius: 8, padding: 10 },
    infoCardIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: s.accentColor, marginBottom: 4 },
    infoLabel: { fontSize: 7, fontWeight: "bold", color: s.accentColor, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 2 },
    infoValue: { fontSize: s.bodyStyle.fontSize, color: s.bodyStyle.color },
    // Stat grid
    statGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginBottom: 14 },
    statCard: { width: "31%", backgroundColor: tint(s.accentColor, 0.92), borderRadius: 8, padding: 10, alignItems: "center" as const },
    statIcon: { width: 24, height: 24, borderRadius: 6, backgroundColor: s.accentColor, marginBottom: 6, alignItems: "center" as const, justifyContent: "center" as const },
    statValue: { fontSize: 16, fontWeight: "bold", color: s.accentColor, textAlign: "center" as const },
    statLabel: { fontSize: 7, color: "#888888", textAlign: "center" as const, marginTop: 2 },
    // Budget
    budgetCard: { backgroundColor: s.accentColor, borderRadius: 10, padding: 16, marginBottom: 14, alignItems: "center" as const },
    budgetLabel: { fontSize: 8, fontWeight: "bold", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: 1 },
    budgetValue: { fontSize: 22, fontWeight: "bold", color: "#ffffff", marginTop: 4 },
    // Alloc bar
    allocRow: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 6, gap: 8 },
    allocBadge: { width: 36, height: 36, borderRadius: 6, backgroundColor: s.accentColor, alignItems: "center" as const, justifyContent: "center" as const },
    allocPercent: { color: "#ffffff", fontSize: 10, fontWeight: "bold" },
    allocBarBg: { flex: 1, height: 5, backgroundColor: tint(s.accentColor, 0.9), borderRadius: 3 },
    allocBarFill: { height: 5, backgroundColor: s.accentColor, borderRadius: 3 },
    // Team
    teamGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6 },
    teamCard: { width: "48%", flexDirection: "row" as const, backgroundColor: tint(s.accentColor, 0.93), borderRadius: 8, padding: 10, gap: 8, alignItems: "center" as const },
    teamAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: s.accentColor, alignItems: "center" as const, justifyContent: "center" as const },
    teamInitial: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
    teamName: { fontSize: s.bodyStyle.fontSize, fontWeight: "bold" },
    teamRole: { fontSize: s.bodyStyle.fontSize - 1, color: "#888888" },
    // Sponsor package
    pkgCard: { marginBottom: 10, borderRadius: 8, overflow: "hidden" as const, borderWidth: 0.5, borderColor: tint(s.accentColor, 0.7) },
    pkgBody: { padding: 10 },
    // Trend
    trendCard: { flexDirection: "row" as const, backgroundColor: tint(s.accentColor, 0.95), borderRadius: 6, padding: 8, gap: 8, marginBottom: 6 },
    trendNum: { width: 18, height: 18, borderRadius: 9, backgroundColor: s.accentColor, alignItems: "center" as const, justifyContent: "center" as const },
    trendNumText: { color: "#ffffff", fontSize: 8, fontWeight: "bold" },
    // Contact
    contactBlock: { borderRadius: 8, overflow: "hidden" as const, borderWidth: 0.5, borderColor: tint(s.accentColor, 0.8), marginTop: 16 },
    contactHeader: { backgroundColor: s.accentColor, padding: 10 },
    contactBody: { padding: 12 },
    contactRow: { flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 6, gap: 8 },
    contactIcon: { width: 16, height: 16, borderRadius: 4, backgroundColor: tint(s.accentColor, 0.9), alignItems: "center" as const, justifyContent: "center" as const },
    // Footer
    footer: { position: "absolute" as const, bottom: 25, left: 50, right: 50, textAlign: "center" as const, fontSize: 7, color: "#aaaaaa" },
    pageNumber: { position: "absolute" as const, bottom: 25, right: 50, fontSize: 8, color: "#999999" },
    sectionImage: { width: "100%", height: 140, objectFit: "cover" as const, borderRadius: 6, marginBottom: 12 },
  });

// =============================================================================
// DOCUMENT
// =============================================================================
interface ProposalDocumentProps { data: ProposalData; }

export const ProposalDocument = ({ data }: ProposalDocumentProps) => {
  const s = data.styling;
  const styles = createStyles(s);

  const Footer = () => (
    <>
      <Text style={styles.footer}>Karang Taruna Mojosongo — Proposal Sponsorship</Text>
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </>
  );

  const PageNum = ({ num }: { num: string }) => (
    <View style={{ flexDirection: "row" as const, alignItems: "center" as const, marginBottom: 10 }}>
      <Text style={styles.pageNum}>{num}</Text>
      <View style={styles.pageNumLine} />
    </View>
  );

  const SecHead = ({ title }: { title: string }) => (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionDivider} />
    </>
  );

  const Bullet = ({ text }: { text: string }) => (
    <View style={styles.listItem}><View style={styles.listBullet} /><Text style={styles.listText}>{text}</Text></View>
  );
  const Arrow = ({ text }: { text: string }) => (
    <View style={styles.listItem}><View style={styles.listArrow} /><Text style={styles.listText}>{text}</Text></View>
  );

  return (
    <Document>
      {/* ══ COVER ══ */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverHeader}>
          {data.logoUrl && <Image src={data.logoUrl} style={{ width: 56, height: 56, marginBottom: 18, borderRadius: 8 }} />}
          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: 4, textTransform: "uppercase" as const, marginBottom: 8 }}>Dokumen Resmi</Text>
          <Text style={styles.coverTitle}>PROPOSAL{"\n"}SPONSORSHIP</Text>
          <View style={styles.coverDivider} />
          <Text style={styles.coverSubtitle}>Karang Taruna Mojosongo</Text>
          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>2026</Text>
        </View>
        <View style={styles.coverBody}>
          {data.headerImage && <Image src={data.headerImage} style={{ width: "100%", height: 180, objectFit: "cover" as const, borderRadius: 6, marginBottom: 20 }} />}
          <Text style={{ fontSize: 8, color: "#999999", textAlign: "center" as const }}>Dokumen ini bersifat rahasia dan ditujukan hanya untuk pihak yang berkepentingan.</Text>
        </View>
        <Footer />
      </Page>

      {/* ══ 01: LATAR BELAKANG ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[0]?.backgroundColor || "#ffffff" }}>
        <PageNum num="01" />
        <SecHead title="Latar Belakang" />
        {data.images.latar_belakang && <Image src={data.images.latar_belakang} style={styles.sectionImage} />}
        <Text style={styles.paragraph}>{data.latarBelakang}</Text>
        <Footer />
      </Page>

      {/* ══ 02: TUJUAN & MANFAAT ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[1]?.backgroundColor || "#ffffff" }}>
        <PageNum num="02" />
        <SecHead title="Tujuan dan Manfaat" />
        <Text style={styles.subTitle}>Tujuan Acara:</Text>
        {data.tujuanAcara.map((t, i) => <Bullet key={i} text={t} />)}
        <Text style={{ ...styles.subTitle, marginTop: 16 }}>Manfaat bagi Sponsor:</Text>
        {data.manfaatSponsor.map((m, i) => <Arrow key={i} text={m} />)}
        <Footer />
      </Page>

      {/* ══ 03: DESKRIPSI ACARA ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[2]?.backgroundColor || "#ffffff" }}>
        <PageNum num="03" />
        <SecHead title="Deskripsi Acara" />
        <View style={styles.infoGrid}>
          {data.deskripsiAcara.tema ? <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Tema</Text><Text style={styles.infoValue}>{data.deskripsiAcara.tema}</Text></View> : null}
          {data.deskripsiAcara.bentukKegiatan ? <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Bentuk</Text><Text style={styles.infoValue}>{data.deskripsiAcara.bentukKegiatan}</Text></View> : null}
          {data.deskripsiAcara.jadwal ? <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Jadwal</Text><Text style={styles.infoValue}>{data.deskripsiAcara.jadwal}</Text></View> : null}
          {data.deskripsiAcara.jumlahPeserta ? <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Peserta</Text><Text style={styles.infoValue}>{data.deskripsiAcara.jumlahPeserta} orang</Text></View> : null}
        </View>
        {data.images.deskripsi_acara && <Image src={data.images.deskripsi_acara} style={styles.sectionImage} />}
        <Text style={styles.paragraph}>{data.deskripsiAcara.detail}</Text>
        <Footer />
      </Page>

      {/* ══ 04: PROFIL PESERTA ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[3]?.backgroundColor || "#ffffff" }}>
        <PageNum num="04" />
        <SecHead title="Profil Peserta & Target Audiens" />
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Usia</Text><Text style={styles.infoValue}>{data.profilPeserta.usia || "—"}</Text></View>
          <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Gender</Text><Text style={styles.infoValue}>{data.profilPeserta.gender || "—"}</Text></View>
          <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Profesi</Text><Text style={styles.infoValue}>{data.profilPeserta.profesi || "—"}</Text></View>
          <View style={styles.infoCard}><View style={styles.infoCardIcon} /><Text style={styles.infoLabel}>Lokasi</Text><Text style={styles.infoValue}>{data.profilPeserta.lokasi || "—"}</Text></View>
        </View>
        <Text style={styles.paragraph}>{data.profilPeserta.narasi}</Text>
        <Footer />
      </Page>

      {/* ══ 05: DATA PENDUKUNG ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[4]?.backgroundColor || "#ffffff" }}>
        <PageNum num="05" />
        <SecHead title="Data Pendukung" />
        {data.dataPendukung.narasi && <Text style={styles.paragraph}>{data.dataPendukung.narasi}</Text>}
        {data.dataPendukung.statistik.length > 0 && (
          <View style={styles.statGrid}>
            {data.dataPendukung.statistik.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={styles.statIcon}><Text style={{ color: "#ffffff", fontSize: 8 }}>●</Text></View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}
        {data.dataPendukung.trendPopuler.length > 0 && (
          <>
            <Text style={styles.subTitle}>Trend Populer di Wilayah</Text>
            {data.dataPendukung.trendPopuler.map((trend, i) => (
              <View key={i} style={styles.trendCard}>
                <View style={styles.trendNum}><Text style={styles.trendNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: s.bodyStyle.fontSize, fontWeight: "bold" }}>{trend.judul}</Text>
                  <Text style={{ fontSize: s.bodyStyle.fontSize - 1, color: "#888888", marginTop: 2 }}>{trend.deskripsi}</Text>
                </View>
              </View>
            ))}
          </>
        )}
        {data.dataPendukung.sumberData && <Text style={{ fontSize: 7, color: "#aaaaaa", marginTop: 10, fontStyle: "italic" }}>Sumber: {data.dataPendukung.sumberData}</Text>}
        <Footer />
      </Page>

      {/* ══ 06: ANGGARAN DANA ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[5]?.backgroundColor || "#ffffff" }}>
        <PageNum num="06" />
        <SecHead title="Anggaran Dana" />
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Total Anggaran</Text>
          <Text style={styles.budgetValue}>{data.anggaranDana.totalAnggaran}</Text>
        </View>
        {data.anggaranDana.alokasi.map((a, i) => (
          <View key={i} style={styles.allocRow}>
            <View style={styles.allocBadge}><Text style={styles.allocPercent}>{a.persentase}%</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: s.bodyStyle.fontSize, fontWeight: "bold", marginBottom: 3 }}>{a.kategori}</Text>
              <View style={styles.allocBarBg}><View style={{ ...styles.allocBarFill, width: `${a.persentase}%` }} /></View>
            </View>
          </View>
        ))}
        <Footer />
      </Page>

      {/* ══ 07: STRUKTUR PANITIA ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[6]?.backgroundColor || "#ffffff" }}>
        <PageNum num="07" />
        <SecHead title="Struktur Panitia" />
        <View style={styles.teamGrid}>
          {data.strukturPanitia.map((p, i) => (
            <View key={i} style={styles.teamCard}>
              <View style={{ ...styles.teamAvatar, backgroundColor: i === 0 ? s.accentColor : tint(s.accentColor, 0.3) }}>
                <Text style={styles.teamInitial}>{p.nama.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.teamName}>{p.nama}</Text>
                <Text style={styles.teamRole}>{p.posisi}</Text>
              </View>
            </View>
          ))}
        </View>
        <Footer />
      </Page>

      {/* ══ 08: PAKET SPONSORSHIP ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[7]?.backgroundColor || "#ffffff" }}>
        <PageNum num="08" />
        <SecHead title="Paket Sponsorship" />
        {data.images.paket_sponsorship && <Image src={data.images.paket_sponsorship} style={styles.sectionImage} />}
        {data.paketSponsorship.map((pkg, i) => {
          const hc = pkg.headerColor || s.accentColor;
          return (
            <View key={i} style={{ ...styles.pkgCard, borderColor: tint(hc, 0.7) }}>
              <View style={{ flexDirection: "row" as const, justifyContent: "space-between" as const, padding: 12, alignItems: "center" as const, backgroundColor: hc }}>
                <View>
                  <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: 1 }}>Paket</Text>
                  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#ffffff" }}>{pkg.nama}</Text>
                </View>
                <View style={{ alignItems: "flex-end" as const }}>
                  <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" as const, letterSpacing: 1 }}>Investasi</Text>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#ffffff" }}>{pkg.nilai}</Text>
                </View>
              </View>
              <View style={styles.pkgBody}>
                {pkg.benefits.map((b, j) => <Bullet key={j} text={b} />)}
              </View>
            </View>
          );
        })}
        <Footer />
      </Page>

      {/* ══ 09: PENUTUP & KONTAK ══ */}
      <Page size="A4" style={{ ...styles.page, backgroundColor: s.pageStyles[8]?.backgroundColor || "#ffffff" }}>
        <PageNum num="09" />
        <SecHead title="Penutup" />
        <Text style={styles.paragraph}>{data.penutupKontak.penutup}</Text>

        {(data.penutupKontak.namaKontak || data.penutupKontak.telepon || data.penutupKontak.email) && (
          <View style={styles.contactBlock}>
            <View style={styles.contactHeader}>
              <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>Informasi Kontak</Text>
            </View>
            <View style={styles.contactBody}>
              {data.penutupKontak.namaKontak && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIcon} />
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: "bold", color: s.accentColor, textTransform: "uppercase" as const }}>Nama</Text>
                    <Text style={{ fontSize: s.bodyStyle.fontSize }}>{data.penutupKontak.namaKontak}</Text>
                  </View>
                </View>
              )}
              {data.penutupKontak.telepon && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIcon} />
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: "bold", color: s.accentColor, textTransform: "uppercase" as const }}>Telepon</Text>
                    <Text style={{ fontSize: s.bodyStyle.fontSize }}>{data.penutupKontak.telepon}</Text>
                  </View>
                </View>
              )}
              {data.penutupKontak.email && (
                <View style={styles.contactRow}>
                  <View style={styles.contactIcon} />
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: "bold", color: s.accentColor, textTransform: "uppercase" as const }}>Email</Text>
                    <Text style={{ fontSize: s.bodyStyle.fontSize }}>{data.penutupKontak.email}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        <Footer />
      </Page>
    </Document>
  );
};
