"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

interface UserProfileProps {
  name: string;
  email: string;
  avatarUrl?: string;
  collapsed?: boolean;
  className?: string;
}

export function UserProfile({
  name,
  email,
  avatarUrl,
  collapsed = false,
  className,
}: UserProfileProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-2",
        "transition-colors hover:bg-accent cursor-pointer",
        collapsed && "justify-center",
        className,
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={avatarUrl} alt={name} />
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-foreground">
              {name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {email}
            </span>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </>
      )}
    </div>
  );
}
