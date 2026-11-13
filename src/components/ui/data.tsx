import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Table ─────────────────────────────────────────────────────────── */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-line bg-surface">
      <table className={cn("w-full min-w-[36rem] text-left text-sm", className)} {...props} />
    </div>
  );
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-line bg-paper/70 text-xs text-subtle" {...props} />;
}
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-line" {...props} />;
}
export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("hover:bg-paper/50", className)} {...props} />;
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("px-4 py-3 font-medium", className)} {...props} />;
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-text", className)} {...props} />;
}

/* ── Dashboard KPI widget ──────────────────────────────────────────── */
/**
 * KPI tile. `value` must come from a verified database query. Pass `null`
 * when the data source is not connected — the tile then says so instead of
 * showing a number.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: string | null;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && <Icon className="size-4 text-subtle" aria-hidden />}
      </div>
      {value === null ? (
        <p className="mt-3 text-sm text-subtle">No data source connected</p>
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-text tabular-nums">{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
