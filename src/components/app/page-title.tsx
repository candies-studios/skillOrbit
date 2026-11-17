export function PageTitle({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-[-0.01em] text-ink sm:text-4xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-5 sm:p-6 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-text">{title}</h2>}
      {description && <div className="mt-1 text-sm text-muted">{description}</div>}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
