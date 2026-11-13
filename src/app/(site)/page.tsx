import Link from "next/link";
import { Eye, Hammer, Award, ShieldCheck, Link2, Wallet, ChartLine } from "lucide-react";
import { Container, SectionHeading } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { CategoryOrbit } from "@/components/marketing/orbit";
import { CourseSearchForm } from "@/components/catalog/search-form";
import { CategoryTile, CourseCard, InstructorCard } from "@/components/catalog/cards";
import {
  countCoursesByCategory,
  listCoursesByInstructor,
  listFeaturedCourses,
  listFeaturedInstructors,
  listMembershipPlans,
  listTestimonials,
} from "@/lib/catalog/repository";
import { getCatalogLookups } from "@/lib/catalog/lookups";
import { formatMoney } from "@/lib/money";
import { brand } from "@/config/brand";

const REASONS = [
  {
    icon: Hammer,
    title: "Built around doing",
    body: "Every course ends in something you make — a campaign plan, a store, a portfolio piece — not just a quiz score.",
  },
  {
    icon: Eye,
    title: "Preview before you pay",
    body: "Watch the free preview lessons and read the full curriculum before you decide.",
  },
  {
    icon: Award,
    title: "Certificates you can verify",
    body: "Finish a course and get a certificate with a unique ID anyone can check on our site.",
  },
  {
    icon: ShieldCheck,
    title: "Clear refund terms",
    body: "A plain-language refund and cancellation policy, published before you buy.",
  },
];

export default async function HomePage() {
  const [{ categories, categoryBySlug, instructorBySlug }, featured, counts, instructors, plans, testimonials] =
    await Promise.all([
      getCatalogLookups(),
      listFeaturedCourses(6),
      countCoursesByCategory(),
      listFeaturedInstructors(),
      listMembershipPlans(),
      listTestimonials(),
    ]);

  const instructorCourseCounts = await Promise.all(
    instructors.map(async (i) => (await listCoursesByInstructor(i.slug)).length),
  );
  const monthly = plans.find((p) => p.interval === "month");
  const outcomes = featured.flatMap((c) => c.outcomes.slice(0, 1).map((o) => ({ o, course: c }))).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <div className="animate-fade-in">
            <h1 className="font-display text-[2.75rem] leading-[1.02] font-medium tracking-[-0.025em] text-ink sm:text-6xl lg:text-[4.25rem]">
              Learn digital skills you can put to work this month.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Practical courses in AI, marketing, freelancing, e-commerce, content and business finance. Taught by
              practitioners, priced for India, open to learners everywhere.
            </p>
            <CourseSearchForm className="mt-9 max-w-xl" />
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
              <Link href="/courses" className="font-medium text-primary underline-offset-4 hover:underline">
                Browse all courses
              </Link>
              <Link href="/pricing" className="text-muted underline-offset-4 hover:text-ink hover:underline">
                How membership works
              </Link>
            </div>
          </div>
          <CategoryOrbit categories={categories} />
        </Container>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            title="Choose a skill path"
            description="Six areas where a focused skill can change what you earn or what you can build."
            action={
              <Button asChild variant="secondary">
                <Link href="/categories">All categories</Link>
              </Button>
            }
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <CategoryTile category={c} count={counts[c.slug] ?? 0} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Featured courses */}
      <section className="border-y border-line bg-surface py-20 sm:py-24">
        <Container>
          <SectionHeading
            title="Featured courses"
            description="Start with one of these, or search the full catalogue."
            action={
              <Button asChild variant="secondary">
                <Link href="/courses">View catalogue</Link>
              </Button>
            }
          />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <li key={c.id} className="flex">
                <CourseCard
                  course={c}
                  category={categoryBySlug.get(c.categorySlug)}
                  instructor={instructorBySlug.get(c.instructorSlug)}
                />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Why learn here */}
      <section className="py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading
            className="self-start"
            title={`Why learn with ${brand.name}`}
            description="Short courses that respect your time and your money."
          />
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {REASONS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t-2 border-ink pt-5">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Learning outcomes */}
      {outcomes.length > 0 && (
        <section className="bg-ink py-20 text-white sm:py-24">
          <Container>
            <SectionHeading
              inverse
              title="What you'll be able to do"
              description="A few outcomes from courses in the catalogue."
            />
            <ul className="mt-12 grid gap-px overflow-hidden rounded-lg bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {outcomes.map(({ o, course }) => (
                <li key={course.id} className="bg-ink p-6">
                  <p className="font-display text-xl leading-snug text-white sm:text-2xl">{o}</p>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="mt-4 inline-block text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Instructors */}
      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading
            title="Learn from practitioners"
            description="Instructors are reviewed before they can publish, and every course is checked before it goes live."
            action={
              <Button asChild variant="secondary">
                <Link href="/teach">Teach on {brand.name}</Link>
              </Button>
            }
          />
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {instructors.map((i, idx) => (
              <li key={i.slug} className="flex [&>*]:flex-1">
                <InstructorCard instructor={i} courseCount={instructorCourseCounts[idx] ?? 0} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Membership + affiliate */}
      <section className="pb-20 sm:pb-24">
        <Container className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col rounded-xl bg-primary p-8 text-white sm:p-12">
            <h2 className="max-w-lg font-display text-3xl leading-tight font-medium sm:text-4xl">
              One membership, every eligible course.
            </h2>
            <p className="mt-4 max-w-lg text-lg text-white/80">
              Learn across categories without buying course by course. Monthly or annual, cancel any time.
            </p>
            {monthly && (
              <p className="mt-8 text-white/80">
                From{" "}
                <span className="text-2xl font-semibold text-white tabular-nums">
                  {formatMoney({ amountMinor: monthly.priceMinor, currency: monthly.currency })}
                </span>{" "}
                a month
                {monthly.isSample && <span className="ml-2 text-sm text-white/85">(sample price)</span>}
              </p>
            )}
            <div className="mt-8">
              <Button asChild variant="inverse" size="lg">
                <Link href="/pricing">Compare plans</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-col rounded-xl border border-line bg-surface p-8 sm:p-10">
            <h2 className="font-display text-2xl leading-tight font-medium text-ink sm:text-3xl">
              Recommend courses, earn commission.
            </h2>
            <p className="mt-3 text-muted">
              Share your referral link. When someone buys, you earn a share of the sale.
            </p>
            <ul className="mt-6 space-y-3 text-[15px] text-text">
              <li className="flex gap-3">
                <Link2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Links for the whole site or a single course
              </li>
              <li className="flex gap-3">
                <ChartLine className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Clicks, sales and commissions in one dashboard
              </li>
              <li className="flex gap-3">
                <Wallet className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                Approved payouts to your bank account
              </li>
            </ul>
            <div className="mt-auto pt-8">
              <Button asChild variant="secondary">
                <Link href="/affiliates">About the affiliate programme</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials render only when genuine, consented testimonials exist. */}
      {testimonials.length > 0 && (
        <section className="border-t border-line bg-surface py-20">
          <Container>
            <SectionHeading title="From our learners" />
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <li key={t.id}>
                  <figure className="h-full rounded-lg border border-line p-6">
                    <blockquote className="font-display text-xl leading-snug text-ink">{t.quote}</blockquote>
                    <figcaption className="mt-4 text-sm text-muted">
                      {t.name}, {t.context}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
