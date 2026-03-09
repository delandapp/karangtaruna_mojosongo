import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
    MoreHorizontal, 
    Pencil, 
    Trash2, 
    MapPin, 
    Instagram, 
    Facebook, 
    Youtube, 
    Phone, 
    Mail, 
    Globe,
    Building2,
    Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Organisasi } from "@/features/api/organisasiApi";

interface OrganisasiCardProps {
    organisasi: Organisasi;
    onEdit: (org: Organisasi) => void;
    onDelete: (id: number, nama: string) => void;
}

// Icon mapper for simple social media
const SocialIcon = ({ type, url }: { type: string, url: string }) => {
    let Icon = Globe;
    if (type === 'instagram') Icon = Instagram;
    if (type === 'facebook') Icon = Facebook;
    if (type === 'youtube') Icon = Youtube;
    if (type === 'tiktok') Icon = Globe; // Using Globe for TikTok as lucide has no tiktok icon yet
    if (type === 'whatsapp') Icon = Phone;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a 
                        href={url.startsWith('http') ? url : `https://${url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                        <Icon className="w-4 h-4" />
                    </a>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="capitalize">{type}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function OrganisasiCard({ organisasi, onEdit, onDelete }: OrganisasiCardProps) {
    const hasSocials = organisasi.media_sosial && Object.values(organisasi.media_sosial).some(v => !!v);

    return (
        <Card className="flex flex-col items-center p-6 text-center relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 bg-card">
            {/* 3-Dot Menu */}
            <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Buka menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px] border-border/50 bg-card/80 backdrop-blur-xl">
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                            Aksi Organisasi
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem onClick={() => onEdit(organisasi)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4 text-primary" />
                            <span>Edit Profil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => onDelete(organisasi.id, organisasi.nama_org)}
                            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus Data</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Avatar / Logo */}
            <div className="relative w-24 h-24 mb-4 rounded-full p-1 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center border-2 border-background shadow-inner">
                    {organisasi.logo_url ? (
                        <Image
                            src={organisasi.logo_url}
                            alt={`Logo ${organisasi.nama_org}`}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <Building2 className="w-10 h-10 text-muted-foreground/50" />
                    )}
                </div>
            </div>

            {/* Badge Indicator */}
            <Badge variant="secondary" className="mb-3 uppercase tracking-wider text-[10px] font-semibold text-primary bg-primary/10">
                KOTA {organisasi.kota.toUpperCase()}
            </Badge>

            {/* Name & Role Wrapper */}
            <div className="space-y-1 mb-4">
                <h3 className="text-lg font-bold text-foreground leading-tight px-4 line-clamp-1">
                    {organisasi.nama_org}
                </h3>
                <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {organisasi.kelurahan}, {organisasi.kecamatan}
                </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-2 mb-4 h-8">
                {hasSocials ? (
                    Object.entries(organisasi.media_sosial as Record<string, string>).map(([platform, url]) => {
                        if (!url) return null;
                        return <SocialIcon key={platform} type={platform} url={url} />
                    })
                ) : (
                    <span className="text-xs text-muted-foreground/50 border border-dashed rounded-full px-3 py-1">Belum ada sosmed</span>
                )}
            </div>

            {/* Actions */}
            <div className="flex w-full mt-auto pt-4 border-t border-border/40">
                <Button className="w-full shadow-sm h-10 shadow-primary/20 transition-all hover:shadow-primary/30 rounded-xl" onClick={() => onEdit(organisasi)}>
                    <Eye className="mr-2 h-4 w-4" /> Detail Organisasi
                </Button>
            </div>
        </Card>
    );
}
