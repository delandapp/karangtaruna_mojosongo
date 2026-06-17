"use client";

import { MessageSquare, Heart, MessageCircle, Share2, Award, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TabelTopKontenProps {
  topKonten: any[];
}

export function TabelTopKonten({ topKonten }: TabelTopKontenProps) {
  const getPlatformIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case "facebook":
        return <FaFacebook className="size-4 text-blue-600 dark:text-blue-400" />;
      case "instagram":
        return <FaInstagram className="size-4 text-pink-500" />;
      case "tiktok":
        return <FaTiktok className="size-4 text-foreground" />;
      case "whatsapp":
        return <FaWhatsapp className="size-4 text-emerald-500" />;
      case "twitter":
        return <FaTwitter className="size-4 text-sky-400" />;
      default:
        return <MessageSquare className="size-4" />;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: localeId,
      });
    } catch {
      return "";
    }
  };

  return (
    <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-amber-500" />
          <CardTitle className="text-base font-semibold">🏆 Konten Performa Terbaik (Top 10)</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Daftar postingan dengan rasio interaksi (engagement) tertinggi di seluruh platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {topKonten.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground text-xs p-6">
            <FileText className="size-10 opacity-45 mb-2" />
            <span>Belum ada postingan terpublikasi untuk dianalisis.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold text-xs py-3 px-6">Konten</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6">Platform</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6">Tanggal Posting</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6 text-center">❤️ Likes</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6 text-center">💬 Komentar</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6 text-center">🔄 Share</TableHead>
                  <TableHead className="font-semibold text-xs py-3 px-6 text-right">🔥 Total Interaksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topKonten.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/10">
                    <TableCell className="py-4 px-6 max-w-xs sm:max-w-sm truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-muted-foreground shrink-0 w-4">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-medium truncate" title={item.caption || ""}>
                          {item.caption || "(Tanpa caption)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex gap-1">
                        {item.akun?.platform?.slug && (
                          <div className="bg-muted/50 p-1 rounded-md" title={item.akun?.platform?.nama}>
                            {getPlatformIcon(item.akun.platform.slug)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-4 px-6">
                      {formatTime(item.diposting_pada)}
                    </TableCell>
                    <TableCell className="text-center py-4 px-6 text-sm font-medium">
                      {item.likes.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center py-4 px-6 text-sm font-medium">
                      {item.komentar.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center py-4 px-6 text-sm font-medium">
                      {item.share.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 dark:bg-primary/20 dark:text-primary-foreground font-bold rounded-lg text-xs py-0.5 px-2">
                        {item.total_engagement.toLocaleString()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
