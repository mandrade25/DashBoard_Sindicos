import { type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  badge?: string;
  icon?: LucideIcon;
  tone?: "default" | "accent";
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  sublabel,
  badge,
  icon: Icon,
  tone = "default",
  loading = false,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-md max-sm:p-5">
      {Icon ? (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            tone === "accent" ? "bg-green-50" : "bg-slate-100",
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              tone === "accent" ? "text-minimerx-green" : "text-minimerx-blue",
            )}
          />
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {loading ? (
        <Skeleton className="mt-2 h-10 w-36" />
      ) : (
        <p
          className={cn(
            "mt-1 truncate text-4xl font-bold",
            tone === "accent" ? "text-minimerx-green" : "text-minimerx-navy",
          )}
          title={value}
        >
          {value}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {sublabel ? (
          <p className="text-xs text-minimerx-gray">{sublabel}</p>
        ) : null}
        {badge ? <Badge variant="default">{badge}</Badge> : null}
      </div>
    </div>
  );
}
