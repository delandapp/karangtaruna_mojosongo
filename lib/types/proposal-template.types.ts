// =============================================================================
// PROPOSAL SPONSORSHIP — Types & Helpers
// =============================================================================

/** 9 section proposal sponsor (+ Data Pendukung) */
export type ProposalSectionId =
  | "latar_belakang"
  | "tujuan_manfaat"
  | "deskripsi_acara"
  | "profil_peserta"
  | "data_pendukung"
  | "anggaran_dana"
  | "struktur_panitia"
  | "paket_sponsorship"
  | "penutup_kontak";

/** Metadata navigasi per section */
export interface ProposalSectionMeta {
  id: ProposalSectionId;
  label: string;
  icon: string;
  description: string;
  pageNumber: string; // "01", "02" etc — for magazine style
}

/** Definisi template proposal */
export interface ProposalTemplate {
  id: string;
  nama: string;
  deskripsi: string;
  accentColor: string;
  accentColorHex: string;
  badge: string;
  defaultData: ProposalData;
}

// =============================================================================
// STYLING
// =============================================================================

export type FontFamily =
  | "Inter"
  | "Roboto"
  | "Poppins"
  | "Playfair Display"
  | "Merriweather"
  | "Lora"
  | "Montserrat"
  | "Open Sans";

export type TextAlign = "left" | "center" | "right" | "justify";

export interface TextStyle {
  fontFamily: FontFamily;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: TextAlign;
}

export interface PageStyle {
  backgroundColor: string;
  backgroundGradient?: string;
}

export interface ProposalStyling {
  headingStyle: TextStyle;
  bodyStyle: TextStyle;
  accentColor: string;
  coverPageStyle: PageStyle;
  pageStyles: PageStyle[];    // index per section (9 sections)
  tableHeaderBg: string;
  tableHeaderColor: string;
}

// =============================================================================
// DATA — Statistik Data Pendukung
// =============================================================================

export interface StatistikItem {
  label: string;
  value: string;
  icon?: string; // react-icon name hint
}

export interface TrendItem {
  judul: string;
  deskripsi: string;
}

export interface DataPendukung {
  narasi: string;
  statistik: StatistikItem[];
  trendPopuler: TrendItem[];
  sumberData: string;
}

// =============================================================================
// DATA — Existing Types
// =============================================================================

export interface AlokasiAnggaran {
  kategori: string;
  persentase: number;
}

export interface StrukturPanitiaItem {
  nama: string;
  posisi: string;
}

export interface PaketSponsorshipItem {
  nama: string;
  nilai: string;
  benefits: string[];
  headerColor?: string;
  headerBgImage?: string;
}

export interface ProposalData {
  latarBelakang: string;
  tujuanAcara: string[];
  manfaatSponsor: string[];
  deskripsiAcara: {
    tema: string;
    bentukKegiatan: string;
    jadwal: string;
    jumlahPeserta: string;
    detail: string;
  };
  profilPeserta: {
    usia: string;
    gender: string;
    profesi: string;
    lokasi: string;
    narasi: string;
  };
  dataPendukung: DataPendukung;
  anggaranDana: {
    totalAnggaran: string;
    alokasi: AlokasiAnggaran[];
  };
  strukturPanitia: StrukturPanitiaItem[];
  paketSponsorship: PaketSponsorshipItem[];
  penutupKontak: {
    penutup: string;
    namaKontak: string;
    telepon: string;
    email: string;
  };
  logoUrl?: string;
  headerImage?: string;
  images: Record<string, string>;
  styling: ProposalStyling;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const AVAILABLE_FONTS: { label: string; value: FontFamily; category: string }[] = [
  { label: "Inter", value: "Inter", category: "Sans Serif" },
  { label: "Roboto", value: "Roboto", category: "Sans Serif" },
  { label: "Poppins", value: "Poppins", category: "Sans Serif" },
  { label: "Montserrat", value: "Montserrat", category: "Sans Serif" },
  { label: "Open Sans", value: "Open Sans", category: "Sans Serif" },
  { label: "Playfair Display", value: "Playfair Display", category: "Serif" },
  { label: "Merriweather", value: "Merriweather", category: "Serif" },
  { label: "Lora", value: "Lora", category: "Serif" },
];

export const PRESET_COLORS = [
  "#1e3a5f", "#0f172a", "#1e293b", "#334155",
  "#7c3aed", "#6d28d9", "#4f46e5", "#3b82f6",
  "#0d9488", "#059669", "#16a34a", "#65a30d",
  "#dc2626", "#ea580c", "#d97706", "#ca8a04",
  "#be185d", "#db2777", "#ec4899", "#f472b6",
  "#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0",
  "#000000", "#18181b", "#27272a", "#3f3f46",
];

// =============================================================================
// HELPERS
// =============================================================================

export function createDefaultStyling(accentHex: string): ProposalStyling {
  return {
    headingStyle: { fontFamily: "Inter", fontSize: 14, fontWeight: "bold", fontStyle: "normal", color: accentHex, textAlign: "left" },
    bodyStyle: { fontFamily: "Inter", fontSize: 10, fontWeight: "normal", fontStyle: "normal", color: "#1a1a1a", textAlign: "left" },
    accentColor: accentHex,
    coverPageStyle: { backgroundColor: "#ffffff" },
    pageStyles: Array(9).fill({ backgroundColor: "#ffffff" }),
    tableHeaderBg: accentHex,
    tableHeaderColor: "#ffffff",
  };
}

export function isSectionComplete(sectionId: ProposalSectionId, data: ProposalData): boolean {
  switch (sectionId) {
    case "latar_belakang": return data.latarBelakang.trim().length > 20;
    case "tujuan_manfaat": return data.tujuanAcara.length > 0 && data.manfaatSponsor.length > 0;
    case "deskripsi_acara": return !!(data.deskripsiAcara.tema.trim() && data.deskripsiAcara.detail.trim());
    case "profil_peserta": return !!(data.profilPeserta.usia.trim() && data.profilPeserta.narasi.trim());
    case "data_pendukung": return data.dataPendukung.statistik.length > 0;
    case "anggaran_dana": return !!(data.anggaranDana.totalAnggaran.trim() && data.anggaranDana.alokasi.length > 0);
    case "struktur_panitia": return data.strukturPanitia.length > 0;
    case "paket_sponsorship": return data.paketSponsorship.length > 0;
    case "penutup_kontak": return !!(data.penutupKontak.penutup.trim() && data.penutupKontak.namaKontak.trim());
    default: return false;
  }
}

export function createEmptyProposalData(accentHex = "#1e3a5f"): ProposalData {
  return {
    latarBelakang: "",
    tujuanAcara: [],
    manfaatSponsor: [],
    deskripsiAcara: { tema: "", bentukKegiatan: "", jadwal: "", jumlahPeserta: "", detail: "" },
    profilPeserta: { usia: "", gender: "", profesi: "", lokasi: "", narasi: "" },
    dataPendukung: { narasi: "", statistik: [], trendPopuler: [], sumberData: "" },
    anggaranDana: { totalAnggaran: "", alokasi: [] },
    strukturPanitia: [],
    paketSponsorship: [],
    penutupKontak: { penutup: "", namaKontak: "", telepon: "", email: "" },
    images: {},
    styling: createDefaultStyling(accentHex),
  };
}
