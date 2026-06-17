"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

interface KalenderKontenProps {
  kontenList: any[];
  onSelectKonten: (konten: any) => void;
}

export function KalenderKonten({ kontenList, onSelectKonten }: KalenderKontenProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  // Get starting day of the week (0 = Sunday, 1 = Monday, etc.)
  const startDayOfWeek = getDay(firstDayOfMonth);

  // Create padding cells for the grid before the 1st of the month
  const paddingCells = Array.from({ length: startDayOfWeek });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getPlatformIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="size-3 text-blue-600 dark:text-blue-400" />;
      case "instagram":
        return <FaInstagram className="size-3 text-pink-500" />;
      case "tiktok":
        return <FaTiktok className="size-3 text-foreground" />;
      case "whatsapp":
        return <FaWhatsapp className="size-3 text-emerald-500" />;
      case "twitter":
        return <FaTwitter className="size-3 text-sky-400" />;
      default:
        return <MessageSquare className="size-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40";
      case "published":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/40";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* Calendar Header Control */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-5 text-primary" />
            <h2 className="text-base font-bold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </h2>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Days Name Header Row */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2 mb-2">
          {dayNames.map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>

        {/* Monthly Grid */}
        <div className="grid grid-cols-7 gap-2 auto-rows-[100px]">
          {/* Padding empty cells */}
          {paddingCells.map((_, idx) => (
            <div
              key={`pad-${idx}`}
              className="rounded-xl border border-transparent bg-muted/5 opacity-45"
            />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day) => {
            // Filter posts scheduled on this date
            const postsOnDay = kontenList.filter((konten) => {
              const dateToCompare = konten.dijadwalkan_pada || konten.diposting_pada || konten.dibuat_pada;
              return dateToCompare ? isSameDay(new Date(dateToCompare), day) : false;
            });

            return (
              <div
                key={day.toString()}
                className={`rounded-xl border border-border/40 bg-background/30 p-2 flex flex-col justify-between overflow-hidden hover:border-primary/40 transition-colors
                  ${isSameDay(day, new Date()) ? "border-primary bg-primary/5 dark:bg-primary/10" : ""}`}
              >
                {/* Date Number */}
                <span className={`text-xs font-bold leading-none ${isSameDay(day, new Date()) ? "text-primary" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>

                {/* Day posts preview */}
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5">
                  {postsOnDay.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => onSelectKonten(post)}
                      className={`text-[9px] font-semibold border rounded px-1 py-0.5 flex items-center justify-between gap-1 cursor-pointer hover:opacity-85 transition-opacity truncate
                        ${getStatusColor(post.status)}`}
                      title={post.caption || "Detail Konten"}
                    >
                      <span className="truncate flex-1 leading-none">{post.caption || "(Tanpa Caption)"}</span>
                      <span className="shrink-0 flex items-center gap-0.5">
                        {post.platform?.map((p: any, idx: number) => (
                          <span key={idx} className="shrink-0">
                            {getPlatformIcon(p.platform?.slug || "")}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
