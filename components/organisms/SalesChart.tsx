"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Bar Chart Data ---
const BAR_DATA = [
  { label: "Jan", value: 65 },
  { label: "Feb", value: 120 },
  { label: "Mar", value: 90 },
  { label: "Apr", value: 155 },
  { label: "Mei", value: 80 },
  { label: "Jun", value: 140 },
  { label: "Jul", value: 100 },
  { label: "Agu", value: 170 },
  { label: "Sep", value: 130 },
];

const maxBar = Math.max(...BAR_DATA.map((d) => d.value));

// --- Line Chart Data ---
const LINE_POINTS = [20, 45, 30, 60, 40, 70, 55, 80, 65];
const LINE_MAX = 100;
const LINE_WIDTH = 280;
const LINE_HEIGHT = 120;

function getLinePath(
  points: number[],
  width: number,
  height: number,
  max: number,
) {
  const step = width / (points.length - 1);
  return points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p / max) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function getAreaPath(
  points: number[],
  width: number,
  height: number,
  max: number,
) {
  const linePath = getLinePath(points, width, height, max);
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}

export function SalesChart() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      {/* Bar Chart — 3 cols */}
      <Card className="lg:col-span-3 border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Total Kegiatan
              </CardTitle>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight">128</span>
                <span className="text-xs font-medium text-emerald-500">
                  +20% dari tahun lalu
                </span>
              </div>
            </div>
            <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              12 bulan terakhir
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex h-44 items-end gap-2">
            {BAR_DATA.map((bar, i) => {
              const heightPercent = (bar.value / maxBar) * 100;
              return (
                <div
                  key={bar.label}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-7 rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                    {bar.value}
                  </div>
                  {/* Bar */}
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-500 ease-out",
                      "bg-primary/80 group-hover:bg-primary",
                    )}
                    style={{
                      height: `${heightPercent}%`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  />
                  {/* Label */}
                  <span className="mt-2 text-[10px] text-muted-foreground">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Line Chart — 2 cols */}
      <Card className="lg:col-span-2 border-border/60">
        <CardHeader className="pb-2">
          <div>
            <CardTitle className="text-base font-semibold">
              Total Keuangan
            </CardTitle>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight">
                Rp 20.462.890
              </span>
              <span className="text-xs font-medium text-emerald-500">
                +28% dari tahun lalu
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-4">
          <svg
            viewBox={`0 0 ${LINE_WIDTH} ${LINE_HEIGHT}`}
            className="h-36 w-full"
            preserveAspectRatio="none"
          >
            {/* Area fill */}
            <path
              d={getAreaPath(LINE_POINTS, LINE_WIDTH, LINE_HEIGHT, LINE_MAX)}
              className="fill-primary/10"
            />
            {/* Line */}
            <path
              d={getLinePath(LINE_POINTS, LINE_WIDTH, LINE_HEIGHT, LINE_MAX)}
              className="fill-none stroke-primary stroke-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Dots */}
            {LINE_POINTS.map((p, i) => {
              const x = i * (LINE_WIDTH / (LINE_POINTS.length - 1));
              const y = LINE_HEIGHT - (p / LINE_MAX) * LINE_HEIGHT;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  className="fill-primary stroke-background stroke-2"
                />
              );
            })}
          </svg>
        </CardContent>
      </Card>
    </div>
  );
}
