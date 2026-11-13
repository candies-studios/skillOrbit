import Link from "next/link";
import { Logo } from "@/components/layout/primitives";
import { brand } from "@/config/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,34rem)]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          {children}
        </main>
        <p className="text-sm text-subtle">
          <Link href="/legal/terms" className="hover:text-ink">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/legal/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <svg viewBox="-100 -100 200 200" className="absolute -top-24 -right-24 size-[36rem] opacity-60" aria-hidden>
          <ellipse
            rx="90"
            ry="38"
            fill="none"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="0.5"
            transform="rotate(-20)"
          />
          <ellipse
            rx="66"
            ry="90"
            fill="none"
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="0.5"
            transform="rotate(30)"
          />
          <circle r="22" fill="var(--color-primary)" />
          <circle cx="78" cy="-30" r="3.5" fill="var(--color-marigold)" />
        </svg>
        <p className="relative max-w-sm font-display text-3xl leading-tight">
          One account for learning, teaching and referring.
        </p>
        <p className="relative mt-3 max-w-sm text-white/60">{brand.tagline}</p>
      </aside>
    </div>
  );
}
