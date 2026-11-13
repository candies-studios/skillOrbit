"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavLink } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {links.map((l) => {
        const active = isActivePath(pathname, l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-[15px] transition-colors",
                active ? "font-medium text-ink" : "text-muted hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
