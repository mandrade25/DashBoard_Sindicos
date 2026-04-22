"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function getBaseFontSize(value: string) {
  const compactValue = value.replace(/\s+/g, "");

  if (compactValue.length >= 14) return 34;
  if (compactValue.length >= 11) return 38;
  if (compactValue.length >= 9) return 42;
  return 46;
}

function splitCurrency(value: string) {
  const match = value.match(/^([^\d-]+)\s*(.+)$/);
  if (!match) {
    return { prefix: null, amount: value };
  }

  return {
    prefix: match[1].trim(),
    amount: match[2].trim(),
  };
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
  const { prefix, amount } = useMemo(() => splitCurrency(value), [value]);
  const baseFontSize = useMemo(() => getBaseFontSize(value), [value]);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState(baseFontSize);

  useEffect(() => {
    const element = measureRef.current;
    if (!element) return;

    const fitValue = () => {
      const parentWidth = element.parentElement?.clientWidth ?? 0;
      const contentWidth = element.scrollWidth;

      if (!parentWidth || !contentWidth) {
        setFontSize(baseFontSize);
        return;
      }

      const nextFontSize =
        contentWidth > parentWidth
          ? Math.max(28, Math.floor(baseFontSize * (parentWidth / contentWidth)))
          : baseFontSize;

      setFontSize(nextFontSize);
    };

    fitValue();

    const observer = new ResizeObserver(() => {
      fitValue();
    });

    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);

    return () => {
      observer.disconnect();
    };
  }, [baseFontSize, value]);

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
        <div className="mt-2 overflow-hidden">
          <div
            ref={measureRef}
            className={cn(
              "flex w-max min-w-0 max-w-full items-baseline gap-1.5 whitespace-nowrap",
              tone === "accent" ? "text-minimerx-green" : "text-minimerx-navy",
            )}
            style={{ fontSize: `${fontSize}px` }}
            title={value}
          >
            {prefix ? (
              <span className="shrink-0 font-bold leading-none tracking-[-0.03em]" style={{ fontSize: "0.68em" }}>
                {prefix}
              </span>
            ) : null}
            <span className="min-w-0 font-bold leading-none tracking-[-0.04em]">{amount}</span>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {sublabel ? (
          <p className="text-xs text-minimerx-gray">{sublabel}</p>
        ) : null}
        {badge ? <Badge variant="default">{badge}</Badge> : null}
      </div>
    </div>
  );
}
