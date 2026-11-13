import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)} {...props} />;
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <circle cx="16" cy="16" r="7" fill="currentColor" />
      <ellipse
        cx="16"
        cy="16"
        rx="14"
        ry="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        transform="rotate(-28 16 16)"
        opacity="0.55"
      />
      <circle cx="27.4" cy="10" r="2.4" fill="var(--color-marigold)" />
    </svg>
  );
}

export function Logo({ className, inverse }: { className?: string; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        inverse ? "text-white" : "text-ink",
        className,
      )}
      aria-label={`${brand.name} home`}
    >
      <LogoMark className={inverse ? "text-white" : "text-primary"} />
      <span className="text-[19px]">{brand.name}</span>
    </Link>
  );
}

/** Page title block for inner pages. */
export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-line bg-surface", className)}>
      <Container className="py-12 sm:py-16">
        <h1 className="max-w-3xl font-display text-4xl leading-[1.08] font-medium tracking-[-0.015em] text-ink sm:text-5xl">
          {title}
        </h1>
        {description && <div className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{description}</div>}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
  inverse,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  inverse?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        <h2
          className={cn(
            "font-display text-3xl leading-tight font-medium tracking-[-0.01em] sm:text-[2.5rem]",
            inverse ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-3 text-[17px] leading-relaxed", inverse ? "text-white/70" : "text-muted")}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
