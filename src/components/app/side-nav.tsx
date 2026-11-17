"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavGroup = { title: string; links: { href: string; label: string; exact?: boolean }[] };

export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-24 lg:self-start">
      {/* Mobile: one horizontal scroller. Desktop: grouped column. */}
      <ul className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-2 lg:hidden">
        {groups.flatMap((g) =>
          g.links.map((l) => (
            <li key={`${g.title}-${l.href}`} className="shrink-0">
              <Link
                href={l.href}
                aria-current={isActive(l.href, l.exact) ? "page" : undefined}
                className={cn(
                  "block rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap",
                  isActive(l.href, l.exact)
                    ? "border-ink bg-ink text-white"
                    : "border-line-strong bg-surface text-muted hover:text-ink",
                )}
              >
                {g.title === "Admin" && !l.label.startsWith("Admin") ? `Admin: ${l.label}` : l.label}
              </Link>
            </li>
          )),
        )}
      </ul>
      <div className="hidden space-y-6 lg:block">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-3 text-xs font-semibold text-subtle">{g.title}</p>
            <ul className="mt-2 space-y-0.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={isActive(l.href, l.exact) ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-2 text-[15px]",
                      isActive(l.href, l.exact)
                        ? "bg-primary-soft font-medium text-primary-ink"
                        : "text-muted hover:bg-surface hover:text-ink",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
