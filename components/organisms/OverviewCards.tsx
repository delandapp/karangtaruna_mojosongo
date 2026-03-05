import { StatCard } from "@/components/molecules/StatCard";
import { Users, CalendarDays, Wallet, FileText } from "lucide-react";

const STATS = [
  {
    title: "Total Anggota",
    value: "1.542",
    change: "+12% dari bulan lalu",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Total Kegiatan",
    value: "128",
    change: "+8% dari bulan lalu",
    changeType: "positive" as const,
    icon: CalendarDays,
  },
  {
    title: "Pemasukan",
    value: "Rp 7.532.000",
    change: "-5% dari bulan lalu",
    changeType: "negative" as const,
    icon: Wallet,
  },
  {
    title: "Laporan",
    value: "342",
    change: "+15% dari bulan lalu",
    changeType: "positive" as const,
    icon: FileText,
  },
];

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
