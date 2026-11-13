import * as React from "react";
import { AlertTriangle, Info, CircleCheck, PlugZap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Badge ─────────────────────────────────────────────────────────── */
const badgeTones = {
  neutral: "bg-paper text-muted border-line",
  primary: "bg-primary-soft text-primary-ink border-transparent",
  marigold: "bg-marigold-soft text-marigold-ink border-transparent",
  success: "bg-success-soft text-success border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  sample: "bg-white text-marigold-ink border-marigold/50 border-dashed",
  inverse: "bg-white/10 text-white border-white/15",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Marks a development seed record so it is never mistaken for real content. */
export function SampleBadge({ className }: { className?: string }) {
  return (
    <Badge tone="sample" className={className} title="Development seed data — not a real listing">
      Sample
    </Badge>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────── */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-line/70", className)} aria-hidden {...props} />;
}

/* ── Notice (inline callout) ───────────────────────────────────────── */
const noticeTones: Record<string, { cls: string; icon: LucideIcon }> = {
  info: { cls: "border-primary/20 bg-primary-soft/60 text-primary-ink", icon: Info },
  warning: { cls: "border-marigold/40 bg-warning-soft text-marigold-ink", icon: AlertTriangle },
  success: { cls: "border-success/25 bg-success-soft text-success", icon: CircleCheck },
  unconfigured: { cls: "border-line-strong border-dashed bg-surface text-muted", icon: PlugZap },
};

export function Notice({
  tone = "info",
  title,
  children,
  className,
  id,
}: {
  tone?: keyof typeof noticeTones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { cls, icon: Icon } = noticeTones[tone]!;
  return (
    <div id={id} className={cn("flex gap-3 rounded-lg border p-4 text-sm leading-relaxed", cls, className)} role="note">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  );
}

/* ── Empty and error states ────────────────────────────────────────── */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "This section didn't load",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center rounded-xl border border-danger/25 bg-danger-soft/50 px-6 py-12 text-center"
      role="alert"
    >
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
