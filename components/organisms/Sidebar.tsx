"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavItem } from "@/components/molecules/NavItem";
import { UserProfile } from "@/components/molecules/UserProfile";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Shield,
  BarChart3,
  Wallet,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Handshake,
  ShieldCheck,
  Calendar,
  Building2,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const GENERAL_NAV = [
  { href: "/dashboard/home", icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/event", icon: Calendar, label: "Event" },
];

const MASTER_NAV = [
  { href: "/dashboard/organisasi", icon: Building2, label: "Organisasi" },
  { href: "/dashboard/jabatan", icon: Briefcase, label: "Jabatan" },
  { href: "/dashboard/level", icon: Shield, label: "Level" },
  { href: "/dashboard/user", icon: Users, label: "User" },
  { href: "/dashboard/hak-akses", icon: ShieldCheck, label: "Akses & Role" },
];

const TOOLS_NAV = [
  { href: "/dashboard/laporan", icon: BarChart3, label: "Laporan" },
  { href: "/dashboard/keuangan", icon: Wallet, label: "Keuangan", badge: 2 },
  {
    href: "/dashboard/sponsorship",
    icon: Handshake,
    label: "Sponsorship",
    subItems: [
      { href: "/dashboard/sponsorship/brand", label: "Brand" },
      {
        href: "/dashboard/sponsorship/kategori-brand",
        label: "Kategori Brand",
      },
      { href: "/dashboard/sponsorship/bidang-brand", label: "Bidang Brand" },
    ],
  },
];

const PROFILE_NAV = [
  { href: "/dashboard/pesan", icon: MessageSquare, label: "Pesan", badge: 2 },
  { href: "/dashboard/notifikasi", icon: Bell, label: "Notifikasi" },
  { href: "/dashboard/pengaturan", icon: Settings, label: "Pengaturan" },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border/60 bg-sidebar",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[250px]",
        className,
      )}
    >
      {/* Logo & Collapse */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-600 shadow-md shadow-primary/25">
              <span className="text-sm font-bold text-white">KT</span>
            </div>
            <span className="text-base font-bold text-foreground">
              KarangTaruna
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      <Separator className="opacity-60" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* General */}
        {!collapsed && (
          <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Umum
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          {GENERAL_NAV.map((item) => (
            <NavItem key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>

        {/* Data Master */}
        <div className="mt-5">
          {!collapsed && (
            <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Data Master
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {MASTER_NAV.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="mt-5">
          {!collapsed && (
            <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Alat
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {TOOLS_NAV.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="mt-5">
          {!collapsed && (
            <span className="mb-2 block px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Profil
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            {PROFILE_NAV.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            "transition-all duration-200 cursor-pointer",
            collapsed && "justify-center px-2",
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      <Separator className="opacity-60" />

      {/* User Profile */}
      <div className="p-3">
        <UserProfile
          name="Admin KT"
          email="admin@karangtaruna.id"
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
