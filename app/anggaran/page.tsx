"use client";

import { useState } from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiShield,
  FiCalendar,
  FiFilter,
  FiExternalLink,
} from "react-icons/fi";
import { BiWallet } from "react-icons/bi";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import CardNav from "@/components/organisms/cards/NavCard";
import { LandingFooter } from "@/components/organisms/landing/LandingFooter";

import { useGetKasPublicQuery, type Kas } from "@/features/api/keuanganApi";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRupiah(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Rp 0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const BULAN_OPTIONS = [
  { value: 0, label: "Semua Bulan" },
  { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
  { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
  { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
  { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

const JENIS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "masuk", label: "💰 Masuk" },
  { value: "keluar", label: "💸 Keluar" },
];

const TAHUN_NOW = new Date().getFullYear();
const TAHUN_OPTIONS = Array.from({ length: 4 }, (_, i) => TAHUN_NOW - i);

const LIMIT = 15;

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    disetujui: {
      label: "Disetujui",
      icon: <FiCheckCircle className="size-3" />,
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
    },
    menunggu_persetujuan: {
      label: "Menunggu",
      icon: <FiClock className="size-3" />,
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30",
    },
    ditolak: {
      label: "Ditolak",
      icon: <FiXCircle className="size-3" />,
      cls: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200/50 dark:border-red-900/30",
    },
  };
  const c = map[status] ?? { label: status, icon: null, cls: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, iconClass, bgClass,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconClass: string; bgClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/20 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bgClass}`}>
        <Icon className={`size-7 ${iconClass}`} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Transaction Row ────────────────────────────────────────────────────────────
function TxRow({ kas }: { kas: Kas }) {
  const isIn = kas.jenis_kas === "masuk";

  // Parse category and description
  const match = kas.deskripsi.match(/^\[(.*?)\] (.*)$/);
  const kategori = match ? match[1] : "Lain-lain";
  const deskripsi = match ? match[2] : kas.deskripsi;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition-colors group">
      {/* Icon */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
        isIn ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-red-100 dark:bg-red-950/40"
      }`}>
        {isIn
          ? <FiTrendingUp className="size-5 text-emerald-600 dark:text-emerald-450" />
          : <FiTrendingDown className="size-5 text-red-600 dark:text-red-450" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{deskripsi}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
            isIn
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
              : "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-450 dark:border-red-900/30"
          }`}>
            {kategori}
          </span>
          <StatusBadge status={kas.status} />
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <FiCalendar className="size-3" />
            {format(new Date(kas.tanggal), "dd MMM yyyy", { locale: localeId })}
          </span>
          <span>·</span>
          <span>{isIn ? "Dari" : "Kepada"}: <strong className="text-gray-700 dark:text-slate-350">{kas.sumber_tujuan}</strong></span>
          {kas.nomor_kas && (
            <>
              <span>·</span>
              <span className="font-mono">{kas.nomor_kas}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`text-base font-bold ${isIn ? "text-emerald-600 dark:text-emerald-450" : "text-red-600 dark:text-red-450"}`}>
          {isIn ? "+" : "-"}{formatRupiah(kas.jumlah)}
        </p>
        {kas.bukti_url && (
          <div className="flex flex-col gap-1 items-end mt-1">
            {kas.bukti_url.split(",").filter(Boolean).map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-0.5 justify-end"
              >
                <FiExternalLink className="size-2.5" /> Bukti {idx + 1}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Monthly Bar Chart ──────────────────────────────────────────────────────────
function MonthlyBarChart({ chartData, isLoading }: { chartData: Kas[] | undefined; isLoading: boolean }) {
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"][i],
    inflow: 0,
    outflow: 0,
  }));

  if (chartData) {
    chartData.forEach((tx) => {
      if (tx.status !== "disetujui") return;
      const date = new Date(tx.tanggal);
      const m = date.getMonth();
      const amount = Number(tx.jumlah);
      if (tx.jenis_kas === "masuk") {
        monthlyData[m].inflow += amount;
      } else if (tx.jenis_kas === "keluar") {
        monthlyData[m].outflow += amount;
      }
    });
  }

  const maxVal = Math.max(...monthlyData.map((d) => Math.max(d.inflow, d.outflow)), 100000);

  const formatBrief = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return `${val}`;
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Grafik Aliran Kas Bulanan</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Perbandingan kas masuk dan kas keluar setiap bulan</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-500 dark:bg-emerald-600" />
            <span className="text-gray-600 dark:text-slate-350 font-medium">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-red-500 dark:bg-red-600" />
            <span className="text-gray-600 dark:text-slate-350 font-medium">Keluar</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[250px] sm:h-[300px] flex items-center justify-center bg-gray-50/50 dark:bg-slate-800/20 rounded-xl animate-pulse">
          <p className="text-xs text-gray-400 dark:text-slate-500">Memuat grafik...</p>
        </div>
      ) : (
        <div className="relative h-[250px] sm:h-[300px] flex gap-2 sm:gap-4 mt-6">
          {/* Y-Axis labels */}
          <div className="flex flex-col justify-between text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 w-10 text-right pr-1 sm:pr-2 select-none font-mono">
            <span>{formatBrief(maxVal)}</span>
            <span>{formatBrief(maxVal * 0.75)}</span>
            <span>{formatBrief(maxVal * 0.5)}</span>
            <span>{formatBrief(maxVal * 0.25)}</span>
            <span>Rp 0</span>
          </div>

          {/* Grid lines and Bars */}
          <div className="flex-1 relative flex flex-col justify-between">
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full border-t border-dashed border-gray-100 dark:border-slate-800/60" />
              ))}
              <div className="w-full border-t border-gray-200 dark:border-slate-800" />
            </div>

            {/* Columns Container */}
            <div className="absolute inset-0 flex justify-between items-end px-1 pb-1">
              {monthlyData.map((d, idx) => {
                const inHeight = `${(d.inflow / maxVal) * 100}%`;
                const outHeight = `${(d.outflow / maxVal) * 100}%`;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group px-0.5 sm:px-1">
                    <div className="w-full flex items-end justify-center gap-[2px] sm:gap-1 h-[90%] relative">
                      {/* Inflow Bar */}
                      <div
                        style={{ height: inHeight }}
                        className="w-[40%] bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 rounded-t-[2px] transition-all duration-500 hover:brightness-110 relative cursor-pointer group/inflow"
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/inflow:flex flex-col items-center z-20">
                          <div className="bg-slate-900 dark:bg-slate-800 text-white text-[9px] py-1 px-2 rounded font-semibold whitespace-nowrap shadow-md">
                            Masuk: {formatRupiah(d.inflow)}
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-0.5" />
                        </div>
                      </div>

                      {/* Outflow Bar */}
                      <div
                        style={{ height: outHeight }}
                        className="w-[40%] bg-gradient-to-t from-red-500 to-red-400 dark:from-red-650 dark:to-red-500 rounded-t-[2px] transition-all duration-500 hover:brightness-110 relative cursor-pointer group/outflow"
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/outflow:flex flex-col items-center z-20">
                          <div className="bg-slate-900 dark:bg-slate-800 text-white text-[9px] py-1 px-2 rounded font-semibold whitespace-nowrap shadow-md">
                            Keluar: {formatRupiah(d.outflow)}
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-800 rotate-45 -mt-0.5" />
                        </div>
                      </div>
                    </div>
                    {/* Month Label */}
                    <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-slate-500 font-semibold mt-2 select-none group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category Breakdown ─────────────────────────────────────────────────────────
interface CategoryBreakdownProps {
  chartData: Kas[];
  isLoading: boolean;
}

function CategoryBreakdown({ chartData, isLoading }: CategoryBreakdownProps) {
  const breakdown = (() => {
    const categories: Record<string, { name: string; masuk: number; keluar: number }> = {};
    let totalMasuk = 0;
    let totalKeluar = 0;

    chartData.forEach((item) => {
      if (item.status !== "disetujui") return;
      const match = item.deskripsi.match(/^\[(.*?)\] (.*)$/);
      const categoryName = match ? match[1] : "Lain-lain";
      const amount = Number(item.jumlah);

      if (!categories[categoryName]) {
        categories[categoryName] = { name: categoryName, masuk: 0, keluar: 0 };
      }

      if (item.jenis_kas === "masuk") {
        categories[categoryName].masuk += amount;
        totalMasuk += amount;
      } else {
        categories[categoryName].keluar += amount;
        totalKeluar += amount;
      }
    });

    const list = Object.values(categories);
    const masukList = [...list].filter((c) => c.masuk > 0).sort((a, b) => b.masuk - a.masuk);
    const keluarList = [...list].filter((c) => c.keluar > 0).sort((a, b) => b.keluar - a.keluar);

    return {
      masukList,
      keluarList,
      totalMasuk,
      totalKeluar,
    };
  })();

  const { masukList, keluarList, totalMasuk, totalKeluar } = breakdown;

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/80 shadow-sm p-6 space-y-4 animate-pulse">
        <div className="h-4 w-48 bg-slate-150 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-150 dark:bg-slate-800 rounded" />
            <div className="h-3 w-5/6 bg-slate-150 dark:bg-slate-800 rounded" />
            <div className="h-3 w-4/6 bg-slate-150 dark:bg-slate-800 rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-150 dark:bg-slate-800 rounded" />
            <div className="h-3 w-5/6 bg-slate-150 dark:bg-slate-800 rounded" />
            <div className="h-3 w-4/6 bg-slate-150 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/80 shadow-sm dark:shadow-slate-950/20 p-6 space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Analisis Kategori Transaksi</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Distribusi pengeluaran dan pemasukan berdasarkan kategori anggaran</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-455 uppercase tracking-wider">Kategori Penerimaan (Kas Masuk)</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatRupiah(totalMasuk)}</span>
          </div>

          {masukList.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-550 italic py-2">Tidak ada data penerimaan.</p>
          ) : (
            <div className="space-y-3.5">
              {masukList.map((c, idx) => {
                const pct = totalMasuk > 0 ? (c.masuk / totalMasuk) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-slate-350">{c.name}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(c.masuk)} <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-850 pb-2">
            <span className="text-xs font-bold text-red-650 dark:text-red-455 uppercase tracking-wider">Kategori Pengeluaran (Kas Keluar)</span>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatRupiah(totalKeluar)}</span>
          </div>

          {keluarList.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-550 italic py-2">Tidak ada data pengeluaran.</p>
          ) : (
            <div className="space-y-3.5">
              {keluarList.map((c, idx) => {
                const pct = totalKeluar > 0 ? (c.keluar / totalKeluar) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-slate-350">{c.name}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(c.keluar)} <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 dark:from-red-600 dark:to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Info Banner ───────────────────────────────────────────────────────────────
function InfoBanner() {
  return (
    <div className="bg-orange-50/50 dark:bg-slate-900/40 border border-orange-200/60 dark:border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4 backdrop-blur-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
        <FiShield className="size-5" />
      </div>
      <div className="space-y-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-350">Informasi Kredibilitas Transparansi Anggaran</h4>
        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">
          Semua catatan keuangan yang tersaji di halaman ini disinkronisasikan secara real-time dengan database utama organisasi. 
          Laporan hanya menampilkan transaksi resmi yang telah melewati proses verifikasi oleh Bendahara dan disetujui secara resmi oleh Ketua Karang Taruna Mojosongo. 
          Masyarakat dapat memeriksa keaslian transaksi dengan mengeklik tautan <strong>Bukti</strong> yang terlampir pada masing-masing baris transaksi.
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnggaranPublikPage() {
  const [page, setPage] = useState(1);
  const [jenis, setJenis] = useState("");
  const [tahun, setTahun] = useState<number>(TAHUN_NOW);
  const [bulan, setBulan] = useState<number>(0);

  const { data, isLoading } = useGetKasPublicQuery({
    page,
    limit: LIMIT,
    jenis_kas: jenis || undefined,
    tahun: tahun || undefined,
    bulan: bulan || undefined,
  });

  const { data: chartQueryData, isLoading: isChartLoading } = useGetKasPublicQuery({
    limit: 500,
    tahun: tahun || undefined,
  });

  const records: Kas[] = data?.data ?? [];
  const summary = data?.summary;
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const chartRecords = chartQueryData?.data ?? [];

  const saldo = summary ? Number(summary.total_masuk) - Number(summary.total_keluar) : 0;

  const hasFilter = !!jenis || bulan !== 0;

  // Get last updated date based on approved transactions
  const lastUpdated = (() => {
    if (chartRecords.length === 0) return null;
    const sorted = [...chartRecords]
      .filter((r) => r.status === "disetujui")
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    if (sorted.length === 0) return null;
    return format(new Date(sorted[0].tanggal), "dd MMMM yyyy", { locale: localeId });
  })();

  const navItems = [
    {
      label: "Home",
      bgColor: "var(--color-primary-600)",
      textColor: "#fff",
      links: [{ label: "Halaman Utama", href: "/", ariaLabel: "Home" }]
    },
    {
      label: "Berita",
      bgColor: "var(--color-accent-500)",
      textColor: "#fff",
      links: [{ label: "Kabar Terbaru", href: "/berita", ariaLabel: "Berita" }]
    },
    {
      label: "Transparansi",
      bgColor: "var(--color-n-800)",
      textColor: "#fff",
      links: [{ label: "Buku Kas", href: "/anggaran", ariaLabel: "Transparansi" }]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300">

      {/* ── Header CardNav ── */}
      <CardNav
        logo="/image/logo/logo-karang-taruna.png"
        logoAlt="Karang Taruna Mojosongo"
        items={navItems}
        baseColor="#0f172a"
        menuColor="#ffffff"
        buttonBgColor="var(--color-primary-500)"
        buttonTextColor="#ffffff"
        ctaLabel="Dashboard"
      />

      <div className="flex-1">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
                <span className="text-sm font-bold text-white">KT</span>
              </div>
              <span className="text-sm font-medium text-white/60">Karang Taruna Mojosongo</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Transparansi Keuangan
            </h1>
            <p className="text-base text-white/70 max-w-xl leading-relaxed">
              Laporan kas masuk dan kas keluar organisasi yang terbuka dan terpercaya.
              Setiap transaksi tercatat, terverifikasi, dan dapat diakses oleh seluruh anggota.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 mt-6 text-xs text-white/60 border-t border-white/10 pt-4">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="size-4 text-emerald-400" />
                <span>Semua transaksi telah disetujui oleh pengurus</span>
              </div>
              {lastUpdated && (
                <div className="flex items-center gap-1.5">
                  <FiClock className="size-4 text-orange-400" />
                  <span>Pembaruan terakhir: <strong className="text-white font-semibold">{lastUpdated}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

          {/* ── Summary Cards ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-slate-900/60 border dark:border-slate-800/80 h-28 animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Total Kas Masuk"
                value={formatRupiah(summary.total_masuk)}
                sub={`${summary.count_masuk} transaksi`}
                icon={FiTrendingUp}
                iconClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-950/40"
              />
              <StatCard
                label="Total Kas Keluar"
                value={formatRupiah(summary.total_keluar)}
                sub={`${summary.count_keluar} transaksi`}
                icon={FiTrendingDown}
                iconClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-100 dark:bg-red-950/40"
              />
              <StatCard
                label="Saldo Bersih"
                value={formatRupiah(Math.abs(saldo))}
                sub={saldo >= 0 ? "Surplus" : "Defisit"}
                icon={BiWallet}
                iconClass={saldo >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-455"}
                bgClass={saldo >= 0 ? "bg-blue-100 dark:bg-blue-950/40" : "bg-orange-100 dark:bg-orange-950/40"}
              />
            </div>
          ) : null}

          {/* ── Monthly Bar Chart ── */}
          <MonthlyBarChart chartData={chartRecords} isLoading={isChartLoading} />

          {/* ── Info Banner ── */}
          <InfoBanner />

          {/* ── Category Breakdown ── */}
          <CategoryBreakdown chartData={chartRecords} isLoading={isChartLoading} />

          {/* ── Filter Bar ── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/80 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
              {/* Tahun */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 dark:text-slate-450 font-medium shrink-0">Tahun</label>
                <div className="flex gap-1 flex-wrap">
                  {TAHUN_OPTIONS.map((y) => (
                    <button
                      key={y}
                      onClick={() => { setTahun(y); setPage(1); }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        tahun === y
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
                          : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-gray-200 dark:hover:bg-slate-700/80"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-5 border-l border-gray-200 dark:border-slate-800 hidden sm:block" />

              {/* Bulan */}
              <select
                value={bulan}
                onChange={(e) => { setBulan(Number(e.target.value)); setPage(1); }}
                className="text-xs rounded-lg border border-gray-200 dark:border-slate-750 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
              >
                {BULAN_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <div className="h-5 border-l border-gray-200 dark:border-slate-800 hidden sm:block" />

              {/* Jenis */}
              <div className="flex gap-1">
                {JENIS_OPTIONS.map((j) => (
                  <button
                    key={j.value}
                    onClick={() => { setJenis(j.value); setPage(1); }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      jenis === j.value
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-sm"
                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-350 hover:bg-gray-200 dark:hover:bg-slate-700/80"
                    }`}
                  >
                    {j.label}
                  </button>
                ))}
              </div>

              {/* Reset filter */}
              {hasFilter && (
                <button
                  onClick={() => { setJenis(""); setBulan(0); setPage(1); }}
                  className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium cursor-pointer"
                >
                  <FiFilter className="size-3.5" /> Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* ── Transaction List ── */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-slate-850">
              <p className="text-sm font-bold text-gray-900 dark:text-white animate-fade">Daftar Transaksi</p>
              {meta && (
                <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                  {meta.total} transaksi ditemukan
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="divide-y divide-gray-50 dark:divide-slate-800/40">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-48 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-24 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
                  <BiWallet className="size-8 text-gray-350 dark:text-slate-600" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-slate-300">Tidak ada transaksi</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">
                  {hasFilter
                    ? "Tidak ada data pada filter yang dipilih. Coba ubah filter."
                    : "Belum ada data transaksi kas yang disetujui untuk tahun ini."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50/80 dark:divide-slate-850">
                {records.map((kas) => (
                  <TxRow key={kas.id} kas={kas} />
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-gray-500 dark:text-slate-450">
                Halaman <span className="font-semibold text-gray-900 dark:text-white">{page}</span> dari{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-55 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <FiChevronLeft className="size-3.5" /> Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-55 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Berikutnya <FiChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Footer Note ── */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Data keuangan ini diperbarui secara real-time dan hanya menampilkan transaksi yang telah disetujui oleh pengurus.{" "}
              <Link href="/" className="text-orange-600 hover:underline dark:text-orange-400">Kembali ke Beranda</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <LandingFooter />
    </div>
  );
}
