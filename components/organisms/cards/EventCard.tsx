"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Jenis event icon map ───────────────────────────────────
const JENIS_ICON: Record<string, string> = {
  festival:    "/image/ilustrasi/jenis_event/festival.png",
  lomba:       "/image/ilustrasi/jenis_event/lomba.png",
  seminar:     "/image/ilustrasi/jenis_event/seminar.png",
  bakti_sosial:"/image/ilustrasi/jenis_event/bakti_sosial.png",
  olahraga:    "/image/ilustrasi/jenis_event/lomba.png",
  seni_budaya: "/image/ilustrasi/jenis_event/festival.png",
  pelatihan:   "/image/ilustrasi/jenis_event/seminar.png",
  lainnya:     "/image/ilustrasi/jenis_event/bakti_sosial.png",
};

// ── Status styling ─────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  perencanaan: { label: "Perencanaan", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  persiapan:   { label: "Persiapan",   className: "bg-blue-100  text-blue-700  dark:bg-blue-900  dark:text-blue-200"  },
  siap:        { label: "Siap",        className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200" },
  berlangsung: { label: "Berlangsung", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200" },
  selesai:     { label: "Selesai",     className: "bg-green-100  text-green-700  dark:bg-green-900  dark:text-green-200"  },
  dibatalkan:  { label: "Dibatalkan",  className: "bg-red-100    text-red-700    dark:bg-red-900    dark:text-red-200"    },
};

// ── Jenis label ────────────────────────────────────────────
const JENIS_LABEL: Record<string, string> = {
  festival:    "Festival",
  lomba:       "Lomba",
  seminar:     "Seminar",
  bakti_sosial:"Bakti Sosial",
  olahraga:    "Olahraga",
  seni_budaya: "Seni & Budaya",
  pelatihan:   "Pelatihan",
  lainnya:     "Lainnya",
};

// ── Gradient per jenis ────────────────────────────────────
const JENIS_GRADIENT: Record<string, string> = {
  festival:    "from-orange-400  to-pink-500",
  lomba:       "from-blue-500    to-indigo-600",
  seminar:     "from-purple-500  to-violet-600",
  bakti_sosial:"from-teal-500    to-cyan-600",
  olahraga:    "from-green-500   to-emerald-600",
  seni_budaya: "from-rose-500    to-red-500",
  pelatihan:   "from-amber-400   to-orange-500",
  lainnya:     "from-slate-400   to-slate-600",
};

// ── Props ─────────────────────────────────────────────────
export interface EventCardData {
  id: number;
  kode_event: string;
  nama_event: string;
  tema_event?: string | null;
  jenis_event: string;
  status_event: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  lokasi?: string | null;
  target_peserta?: number | null;
  organisasi?: { id: number; nama_org: string } | null;
}

interface EventCardProps {
  event: EventCardData;
  onEdit: (event: EventCardData) => void;
  onDelete: (event: EventCardData) => void;
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const router = useRouter();

  const statusCfg  = STATUS_CONFIG[event.status_event] ?? STATUS_CONFIG.perencanaan;
  const gradient   = JENIS_GRADIENT[event.jenis_event] ?? JENIS_GRADIENT.lainnya;
  const iconSrc    = JENIS_ICON[event.jenis_event]    ?? JENIS_ICON.lainnya;
  const jenisLabel = JENIS_LABEL[event.jenis_event]   ?? "Lainnya";

  const mulai   = format(new Date(event.tanggal_mulai),   "d MMM yyyy", { locale: localeId });
  const selesai = format(new Date(event.tanggal_selesai), "d MMM yyyy", { locale: localeId });

  const isProtected = ["berlangsung", "selesai"].includes(event.status_event);

  return (
    <Card className="group relative overflow-hidden border border-border/50 bg-card/80 hover:shadow-xl hover:shadow-black/8 hover:-translate-y-1 transition-all duration-300 ease-out p-0 gap-0">
      {/* ── Top gradient banner ── */}
      <div className={`relative h-2 w-full bg-gradient-to-r ${gradient}`} />

      <CardHeader className="px-5 pt-5 pb-3">
        {/* Icon + kode + status */}
        <div className="flex items-start justify-between gap-2">
          {/* Icon bubble */}
          <div className={`flex-shrink-0 size-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center p-2.5 shadow-md`}>
            <Image
              src={iconSrc}
              alt={jenisLabel}
              width={40}
              height={40}
              className="object-contain drop-shadow-sm"
            />
          </div>

          {/* Kode + 3-dot */}
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
              {event.kode_event}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full hover:bg-muted/80 text-muted-foreground"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => router.push(`/dashboard/event/${event.id}`)}
                  className="gap-2 cursor-pointer"
                >
                  <Eye className="size-3.5" />
                  Detail
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onEdit(event)}
                  disabled={isProtected}
                  className="gap-2 cursor-pointer"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(event)}
                  disabled={isProtected}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title area */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] px-2 py-0.5 rounded-full border-0 font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full font-medium">
              {jenisLabel}
            </Badge>
          </div>
          <h3 className="text-[15px] font-semibold text-foreground leading-snug line-clamp-2 mt-1">
            {event.nama_event}
          </h3>
          {event.tema_event && (
            <p className="text-xs text-muted-foreground line-clamp-1">{event.tema_event}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 space-y-2">
        {/* Date range */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={`size-6 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
            <Calendar className="size-3 text-white" />
          </div>
          <span>{mulai} — {selesai}</span>
        </div>

        {/* Lokasi */}
        {event.lokasi && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`size-6 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
              <MapPin className="size-3 text-white" />
            </div>
            <span className="line-clamp-1">{event.lokasi}</span>
          </div>
        )}

        {/* Target peserta */}
        {event.target_peserta && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`size-6 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
              <Users className="size-3 text-white" />
            </div>
            <span>{event.target_peserta.toLocaleString("id-ID")} Peserta</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-3 border-t border-border/30 flex items-center justify-between gap-2">
        {event.organisasi && (
          <span className="text-[11px] text-muted-foreground truncate">
            📌 {event.organisasi.nama_org}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto gap-1.5 text-xs h-7 px-3 rounded-lg border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          onClick={() => router.push(`/dashboard/event/${event.id}`)}
        >
          <Eye className="size-3" />
          Detail
        </Button>
      </CardFooter>
    </Card>
  );
}
