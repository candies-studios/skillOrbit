import Link from "next/link";
import { Check, Clock, BookOpen, ArrowUpRight } from "lucide-react";
import type { Category, Course, Instructor, MembershipPlan } from "@/lib/catalog/types";
import { courseStats } from "@/lib/catalog/repository";
import { formatMoney, percentOff } from "@/lib/money";
import { cn, formatDuration, initials } from "@/lib/utils";
import { Badge, SampleBadge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CourseCover } from "./course-cover";

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;
export { LEVEL_LABEL };

export function Price({ course, size = "md" }: { course: Course; size?: "md" | "lg" }) {
  if (course.priceMinor === 0) {
    return <span className={cn("font-semibold text-success", size === "lg" ? "text-3xl" : "text-base")}>Free</span>;
  }
  const off = course.compareAtPriceMinor ? percentOff(course.priceMinor, course.compareAtPriceMinor) : 0;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={cn("font-semibold text-text tabular-nums", size === "lg" ? "text-3xl" : "text-base")}>
        {formatMoney({ amountMinor: course.priceMinor, currency: course.currency })}
      </span>
      {course.compareAtPriceMinor && off > 0 && (
        <>
          <s className="text-sm text-subtle tabular-nums">
            {formatMoney({ amountMinor: course.compareAtPriceMinor, currency: course.currency })}
          </s>
          <span className="text-sm text-success">{off}% off</span>
        </>
      )}
    </span>
  );
}

export function CourseCard({
  course,
  category,
  instructor,
}: {
  course: Course;
  category: Category | undefined;
  instructor: Instructor | undefined;
}) {
  const stats = courseStats(course);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-card">
      <CourseCover seed={course.id} hue={category?.hue ?? 240} label={category?.shortName} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge>{LEVEL_LABEL[course.level]}</Badge>
          {course.includedInMembership && <Badge tone="primary">In membership</Badge>}
          {course.isSample && <SampleBadge />}
        </div>
        <h3 className="text-lg leading-snug font-semibold text-text">
          <Link href={`/courses/${course.slug}`} className="after:absolute after:inset-0 group-hover:text-primary-ink">
            {course.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-muted">{course.subtitle}</p>
        {instructor && <p className="mt-3 text-sm text-subtle">{instructor.displayName}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <Price course={course} />
          <p className="flex items-center gap-3 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              <BookOpen className="size-3.5" aria-hidden />
              {stats.lessonCount} lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatDuration(stats.totalMinutes)}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
}

export function Avatar({ name, hue = 240, size = "md" }: { name: string; hue?: number; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-white",
        size === "lg" ? "size-24 text-2xl" : "size-14 text-lg",
      )}
      style={{ background: `hsl(${hue} 42% 32%)` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function InstructorCard({ instructor, courseCount }: { instructor: Instructor; courseCount: number }) {
  const hue = (instructor.slug.length * 47) % 360;
  return (
    <article className="group relative flex flex-col rounded-lg border border-line bg-surface p-6 transition-shadow hover:shadow-card">
      <div className="flex items-center gap-4">
        <Avatar name={instructor.displayName} hue={hue} />
        <div className="min-w-0">
          <h3 className="font-semibold text-text">
            <Link
              href={`/instructors/${instructor.slug}`}
              className="after:absolute after:inset-0 group-hover:text-primary-ink"
            >
              {instructor.displayName}
            </Link>
          </h3>
          <p className="text-sm text-muted">{instructor.headline}</p>
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {instructor.expertise.map((e) => (
          <li key={e}>
            <Badge>{e}</Badge>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm text-subtle">
        <span>
          {courseCount} {courseCount === 1 ? "course" : "courses"} · {instructor.location}
        </span>
        {instructor.isSample && <SampleBadge />}
      </div>
    </article>
  );
}

export function CategoryTile({ category, count }: { category: Category; count: number }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col rounded-lg border border-line bg-surface p-6 transition-colors hover:border-ink-3"
    >
      <span className="flex items-start justify-between gap-4">
        <span
          className="grid size-10 place-items-center rounded-full"
          style={{ background: `hsl(${category.hue} 60% 94%)`, color: `hsl(${category.hue} 45% 32%)` }}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-5">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <ellipse
              cx="12"
              cy="12"
              rx="10"
              ry="4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              transform="rotate(-25 12 12)"
            />
          </svg>
        </span>
        <ArrowUpRight className="size-4 text-subtle transition-colors group-hover:text-primary" aria-hidden />
      </span>
      <span className="mt-5 text-lg font-semibold text-text">{category.name}</span>
      <span className="mt-1.5 text-[15px] leading-relaxed text-muted">{category.description}</span>
      <span className="mt-auto pt-5 text-sm text-subtle">
        {count === 0 ? "Courses coming soon" : `${count} ${count === 1 ? "course" : "courses"}`}
      </span>
    </Link>
  );
}

export function PricingCard({ plan, monthlyEquivalentOf }: { plan: MembershipPlan; monthlyEquivalentOf?: number }) {
  const highlighted = plan.isHighlighted;
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border p-7 sm:p-8",
        highlighted ? "border-ink bg-ink text-white" : "border-line bg-surface",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className={cn("text-lg font-semibold", highlighted ? "text-white" : "text-text")}>{plan.name}</h3>
        <div className="flex gap-1.5">
          {highlighted && <Badge tone="marigold">Best value</Badge>}
          {plan.isSample && <SampleBadge />}
        </div>
      </div>
      <p className={cn("mt-2 text-[15px]", highlighted ? "text-white/70" : "text-muted")}>{plan.description}</p>
      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatMoney({ amountMinor: plan.priceMinor, currency: plan.currency })}
        </span>
        <span className={highlighted ? "text-white/60" : "text-subtle"}>/ {plan.interval}</span>
      </p>
      {monthlyEquivalentOf !== undefined && (
        <p className={cn("mt-1 text-sm", highlighted ? "text-white/60" : "text-subtle")}>
          Works out to about {formatMoney({ amountMinor: monthlyEquivalentOf, currency: plan.currency })} a month
        </p>
      )}
      <ul className="mt-6 space-y-3 text-[15px]">
        {plan.benefits.map((b) => (
          <li key={b} className="flex gap-2.5">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-marigold" : "text-success")}
              aria-hidden
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-8">
        <Button
          variant={highlighted ? "inverse" : "primary"}
          className="w-full"
          disabled
          aria-describedby="checkout-status"
        >
          Checkout not live yet
        </Button>
      </div>
    </article>
  );
}
