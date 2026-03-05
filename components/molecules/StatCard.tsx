import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border border-border/60",
        "transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
        "hover:border-primary/20",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                changeType === "positive" && "text-emerald-500",
                changeType === "negative" && "text-red-500",
                changeType === "neutral" && "text-muted-foreground",
              )}
            >
              {change}
            </span>
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              "bg-primary/10 text-primary",
              "transition-transform duration-300 group-hover:scale-110",
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
