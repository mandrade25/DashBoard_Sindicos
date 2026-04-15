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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-minimerx-gray">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-3 h-8 w-32" />
          ) : (
            <p
              className={cn(
                "mt-2 text-3xl font-bold truncate",
                tone === "accent" ? "text-minimerx-green" : "text-minimerx-navy",
              )}
              title={value}
            >
              {value}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            {sublabel ? (
              <p className="text-xs text-minimerx-gray">{sublabel}</p>
            ) : null}
            {badge ? <Badge variant="default">{badge}</Badge> : null}
          </div>
        </div>
        {Icon ? <Icon className="h-5 w-5 flex-shrink-0 text-minimerx-blue" /> : null}
      </div>
    </div>
  );
}
