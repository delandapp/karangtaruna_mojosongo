"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  collapsed?: boolean;
  subItems?: { href: string; label: string }[];
}

export function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  collapsed = false,
  subItems,
}: NavItemProps) {
  const pathname = usePathname();

  const isActive =
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (subItems ? subItems.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")) : false);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isActive && !collapsed) {
      setIsOpen(true);
    }
  }, [isActive, collapsed]);

  useEffect(() => {
    if (collapsed) {
      setIsOpen(false);
    }
  }, [collapsed]);

  if (subItems && subItems.length > 0) {
    const parentActive = isActive;

    const triggerBtn = (
      <button
        type="button"
        onClick={() => {
          if (!collapsed) setIsOpen(!isOpen);
        }}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
          "transition-all duration-200 cursor-pointer",
          parentActive
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <Icon
            className={cn(
              "size-[18px] shrink-0",
              "transition-transform duration-200",
              !parentActive && "group-hover:scale-110"
            )}
          />
          {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
        </div>
        {!collapsed && (
          <ChevronDown
            className={cn(
              "size-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>
    );

    return (
      <div className="flex flex-col gap-1">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{triggerBtn}</TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {label} (Menu)
            </TooltipContent>
          </Tooltip>
        ) : (
          triggerBtn
        )}

        {!collapsed && isOpen && (
          <div className="flex flex-col gap-0.5 pl-9 pr-3 py-1">
            {subItems.map((subItem) => {
              const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    isSubActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const content = (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
        "transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          "transition-transform duration-200 group-hover:scale-110",
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/10 text-primary",
              )}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
