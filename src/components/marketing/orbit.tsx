import Link from "next/link";
import type { Category } from "@/lib/catalog/types";

/**
 * Hero diagram: the launch categories as nodes on two tilted orbits.
 * Node positions are fixed (readable, linkable); only a small marker
 * travels the orbit, and it stops under prefers-reduced-motion.
 */
const POSITIONS = [
  { left: "50%", top: "4%" },
  { left: "92%", top: "30%" },
  { left: "86%", top: "78%" },
  { left: "48%", top: "96%" },
  { left: "8%", top: "72%" },
  { left: "10%", top: "24%" },
];

export function CategoryOrbit({ categories }: { categories: Category[] }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full" aria-hidden>
        <g transform="rotate(-18)">
          <ellipse rx="86" ry="40" fill="none" stroke="var(--color-line-strong)" strokeWidth="0.5" />
          {/* Marker travels the ellipse via offset-path; unsupported browsers leave it hidden behind the centre. */}
          <circle
            r="3.4"
            fill="var(--color-marigold)"
            className="animate-orbit-path"
            style={{ offsetPath: "path('M 86 0 A 86 40 0 1 1 -86 0 A 86 40 0 1 1 86 0')", offsetRotate: "0deg" }}
          />
        </g>
        <g transform="rotate(32)">
          <ellipse
            rx="70"
            ry="92"
            fill="none"
            stroke="var(--color-line-strong)"
            strokeWidth="0.5"
            strokeDasharray="1.5 2.5"
          />
        </g>
        <circle r="96" fill="none" stroke="var(--color-line)" strokeWidth="0.4" />
        <circle r="30" fill="var(--color-ink)" />
        <circle r="38" fill="none" stroke="var(--color-ink)" strokeWidth="0.4" opacity="0.25" />
      </svg>

      <div className="absolute top-1/2 left-1/2 w-[28%] -translate-x-1/2 -translate-y-1/2 text-center text-white">
        <p className="font-display text-[clamp(1.6rem,4vw,2.4rem)] leading-none">{categories.length}</p>
        <p className="mt-1 text-[clamp(0.6rem,1.5vw,0.78rem)] leading-tight text-white/70">skill paths</p>
      </div>

      <ul>
        {categories.slice(0, POSITIONS.length).map((c, i) => (
          <li
            key={c.slug}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-fade-in"
            style={{ ...POSITIONS[i], animationDelay: `${150 + i * 90}ms` }}
          >
            <Link
              href={`/categories/${c.slug}`}
              className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3.5 pl-1.5 text-[13px] font-medium whitespace-nowrap text-text shadow-card transition-colors hover:border-primary hover:text-primary-ink sm:text-sm"
            >
              <span className="size-5 rounded-full" style={{ background: `hsl(${c.hue} 50% 40%)` }} aria-hidden />
              {c.shortName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
