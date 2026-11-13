"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { NavLink } from "@/config/navigation";
import { Dialog, DialogTrigger, SheetContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isActivePath } from "./nav-links";

export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="!size-5" />
        </Button>
      </DialogTrigger>
      <SheetContent title="Menu">
        <nav aria-label="Mobile" className="px-3 py-4">
          <ul className="space-y-0.5">
            {[{ href: "/", label: "Home" }, ...links].map((l) => {
              const active = l.href === "/" ? pathname === "/" : isActivePath(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-3 text-base",
                      active ? "bg-primary-soft font-medium text-primary-ink" : "text-text hover:bg-paper",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-2 border-t border-line p-5">
          <Button asChild className="w-full">
            <Link href="/register" onClick={() => setOpen(false)}>
              Create account
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Dialog>
  );
}
