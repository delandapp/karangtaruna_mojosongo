"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GrafikAnalitikProps {
  analyticsData: any[];
}

export function GrafikAnalitik({ analyticsData }: GrafikAnalitikProps) {
  const [activeMetric, setActiveMetric] = useState<"reach" | "engagement" | "followers" | "impressions">("reach");

  // Group and sum metrics by date
  const chartData = useMemo(() => {
    const grouped = new Map<string, any>();

    analyticsData.forEach((record) => {
      const dateStr = new Date(record.tanggal).toISOString().split("T")[0];
      const existing = grouped.get(dateStr);

      if (existing) {
        existing.followers += record.followers;
        existing.reach += record.reach;
        existing.impressions += record.impressions;
        existing.engagement += record.engagement;
      } else {
        grouped.set(dateStr, {
          tanggal: new Date(record.tanggal),
          followers: record.followers,
          reach: record.reach,
          impressions: record.impressions,
          engagement: record.engagement,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
  }, [analyticsData]);

  // Compute SVG chart parameters
  const chartParams = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map((d) => d[activeMetric]);
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    const valRange = maxVal - minVal;

    // Chart dimensions
    const width = 600;
    const height = 240;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Generate points
    const points = chartData.map((d, index) => {
      const x = paddingLeft + (index / (chartData.length - 1 || 1)) * chartWidth;
      const pct = (d[activeMetric] - minVal) / (valRange || 1);
      const y = paddingTop + chartHeight - pct * chartHeight;
      return { x, y, value: d[activeMetric], date: d.tanggal };
    });

    // Create SVG path string
    let pathD = "";
    let areaD = "";

    if (points.length > 0) {
      // Linear or smooth curve path
      pathD = `M ${points[0].x} ${points[0].y}`;
      points.slice(1).forEach((pt) => {
        pathD += ` L ${pt.x} ${pt.y}`;
      });

      // Area path enclosing below the line for gradient fill
      areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
    }

    return {
      width,
      height,
      points,
      pathD,
      areaD,
      paddingLeft,
      paddingTop,
      chartWidth,
      chartHeight,
      maxVal,
      minVal,
    };
  }, [chartData, activeMetric]);

  const metrics = [
    { key: "reach", label: "Jangkauan (Reach)" },
    { key: "impressions", label: "Impresi" },
    { key: "engagement", label: "Interaksi (Engagement)" },
    { key: "followers", label: "Pengikut" },
  ];

  if (chartData.length === 0 || !chartParams) {
    return (
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl p-6 text-center text-muted-foreground text-xs">
        Tidak ada data grafis yang tersedia.
      </Card>
    );
  }

  const { width, height, points, pathD, areaD, paddingLeft, paddingTop, chartWidth, chartHeight, maxVal, minVal } = chartParams;

  const yTicks = 4;
  const xTicks = Math.min(chartData.length, 6);

  return (
    <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">📈 Tren Kinerja Akun</CardTitle>
          <CardDescription className="text-xs">Visualisasi perbandingan metrik kinerja dari waktu ke waktu.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key as any)}
              className={`py-1.5 px-3 text-[10px] font-semibold rounded-lg transition-all
                ${activeMetric === m.key
                  ? "bg-card text-foreground shadow-xs border border-border/30"
                  : "text-muted-foreground hover:text-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {/* Custom SVG Line Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] overflow-visible">
            <defs>
              {/* Line Gradient Fill */}
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-primary, #3b82f6)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {Array.from({ length: yTicks }).map((_, idx) => {
              const y = paddingTop + (idx / (yTicks - 1)) * chartHeight;
              const val = maxVal - (idx / (yTicks - 1)) * (maxVal - minVal);
              return (
                <g key={`grid-y-${idx}`} className="opacity-45">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - 20}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                    className="text-border"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[9px] font-medium text-muted-foreground fill-current"
                  >
                    {Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            {areaD && <path d={areaD} fill="url(#areaGrad)" />}

            {/* Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="var(--color-primary, #3b82f6)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points & Labels */}
            {points.map((pt, idx) => {
              // Only draw hover dot indicators for readability
              const isFirstOrLast = idx === 0 || idx === points.length - 1;
              const isStep = Math.round(points.length / xTicks);
              const shouldShowLabel = idx % isStep === 0 || isFirstOrLast;

              return (
                <g key={`point-${idx}`}>
                  {/* Circle dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="var(--color-primary, #3b82f6)"
                    stroke="var(--color-background, #fff)"
                    strokeWidth="1.5"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                  {/* X Axis Date Label */}
                  {shouldShowLabel && (
                    <g className="opacity-45">
                      <line
                        x1={pt.x}
                        y1={paddingTop + chartHeight}
                        x2={pt.x}
                        y2={paddingTop + chartHeight + 4}
                        stroke="currentColor"
                        strokeWidth="0.8"
                        className="text-border"
                      />
                      <text
                        x={pt.x}
                        y={paddingTop + chartHeight + 15}
                        textAnchor="middle"
                        className="text-[9px] font-semibold text-muted-foreground fill-current"
                      >
                        {format(pt.date, "dd MMM", { locale: localeId })}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Bottom X Axis Baseline */}
            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={width - 20}
              y2={paddingTop + chartHeight}
              stroke="currentColor"
              strokeWidth="0.8"
              className="text-border opacity-50"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
