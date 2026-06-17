"use client";

import { Users, Eye, TrendingUp, BarChart2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KartuSummaryProps {
  analyticsData: any[];
}

export function KartuSummary({ analyticsData }: KartuSummaryProps) {
  // 1. Calculate followers (sum of latest followers per unique account)
  const latestFollowersMap = new Map<number, number>();
  let latestDateMap = new Map<number, Date>();

  analyticsData.forEach((record) => {
    const recordDate = new Date(record.tanggal);
    const currentLatestDate = latestDateMap.get(record.akun_id);

    if (!currentLatestDate || recordDate > currentLatestDate) {
      latestDateMap.set(record.akun_id, recordDate);
      latestFollowersMap.set(record.akun_id, record.followers);
    }
  });

  const totalFollowers = Array.from(latestFollowersMap.values()).reduce((a, b) => a + b, 0);

  // 2. Sum up other metrics
  const totalReach = analyticsData.reduce((acc, curr) => acc + curr.reach, 0);
  const totalImpressions = analyticsData.reduce((acc, curr) => acc + curr.impressions, 0);
  const totalEngagement = analyticsData.reduce((acc, curr) => acc + curr.engagement, 0);

  // Engagement rate = (engagement / impressions) * 100
  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const cards = [
    {
      title: "Total Pengikut",
      value: formatNumber(totalFollowers),
      sub: "+2.4% vs bulan lalu",
      icon: <Users className="size-5 text-blue-500" />,
      bg: "bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/30 dark:border-blue-900/30",
    },
    {
      title: "Total Jangkauan (Reach)",
      value: formatNumber(totalReach),
      sub: "+12.1% vs bulan lalu",
      icon: <Eye className="size-5 text-emerald-500" />,
      bg: "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/30 dark:border-emerald-900/30",
    },
    {
      title: "Total Impresi",
      value: formatNumber(totalImpressions),
      sub: "+8.3% vs bulan lalu",
      icon: <BarChart2 className="size-5 text-indigo-500" />,
      bg: "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100/30 dark:border-indigo-900/30",
    },
    {
      title: "Rasio Keterlibatan",
      value: engagementRate.toFixed(2) + "%",
      sub: "+0.8% vs bulan lalu",
      icon: <TrendingUp className="size-5 text-rose-500" />,
      bg: "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/30 dark:border-rose-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={`border shadow-xs rounded-2xl overflow-hidden backdrop-blur-xs ${card.bg}`}
        >
          <CardContent className="p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-semibold leading-none">
                {card.title}
              </span>
              <h3 className="text-2xl font-bold tracking-tight">{card.value}</h3>
              <p className="text-[10px] text-muted-foreground">{card.sub}</p>
            </div>
            <div className="bg-card p-2 rounded-xl border border-border/40 shadow-xs">
              {card.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
