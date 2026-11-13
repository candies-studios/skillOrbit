import { cn } from "@/lib/utils";

/**
 * Deterministic generated cover art, used until real course imagery is
 * uploaded to Supabase Storage (Phase 3). Each course gets a distinct
 * composition derived from its id; the category sets the hue.
 */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function CourseCover({
  seed,
  hue,
  label,
  className,
  imageUrl,
}: {
  seed: string;
  hue: number;
  label?: string;
  className?: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote storage URLs are configured in Phase 3
      <img src={imageUrl} alt="" className={cn("aspect-[16/10] w-full object-cover", className)} />
    );
  }
  const h = hash(seed);
  const tilt = (h % 50) - 25;
  const cx = 30 + (h % 40);
  const cy = 35 + ((h >>> 5) % 30);
  const r = 18 + ((h >>> 9) % 14);
  const ring2 = 1.6 + ((h >>> 13) % 6) / 10;
  const dotAngle = ((h >>> 17) % 360) * (Math.PI / 180);
  const dx = cx + Math.cos(dotAngle) * r * 1.9;
  const dy = cy + Math.sin(dotAngle) * r * 0.75;
  const bg = `hsl(${hue} 46% 22%)`;
  const mid = `hsl(${hue} 52% 34%)`;
  const light = `hsl(${hue} 70% 80%)`;
  const gid = `g-${h.toString(36)}`;

  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden", className)} style={{ background: bg }}>
      <svg
        viewBox="0 0 160 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <radialGradient id={gid} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={mid} />
            <stop offset="100%" stopColor={bg} />
          </radialGradient>
        </defs>
        <rect width="160" height="100" fill={`url(#${gid})`} />
        <g transform={`rotate(${tilt} ${cx} ${cy})`} fill="none" stroke={light}>
          <ellipse cx={cx} cy={cy} rx={r * 1.9} ry={r * 0.75} strokeWidth="0.5" opacity="0.55" />
          <ellipse cx={cx} cy={cy} rx={r * 1.9 * ring2} ry={r * 0.75 * ring2} strokeWidth="0.35" opacity="0.3" />
        </g>
        <circle cx={cx} cy={cy} r={r * 0.55} fill={light} opacity="0.92" />
        <circle cx={dx} cy={dy} r="2.6" fill="var(--color-marigold)" />
        {Array.from({ length: 14 }).map((_, i) => {
          const v = hash(`${seed}-${i}`);
          return (
            <circle
              key={i}
              cx={v % 160}
              cy={(v >>> 8) % 100}
              r={0.35 + ((v >>> 16) % 5) / 10}
              fill="white"
              opacity="0.35"
            />
          );
        })}
      </svg>
      {label && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}
