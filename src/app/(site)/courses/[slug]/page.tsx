import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  Check,
  Clock,
  FileText,
  Globe,
  Layers,
  ListChecks,
  PlayCircle,
  PenLine,
  BarChart3,
} from "lucide-react";
import { Container } from "@/components/layout/primitives";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge, Notice, SampleBadge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CourseCover } from "@/components/catalog/course-cover";
import { Avatar, LEVEL_LABEL, Price } from "@/components/catalog/cards";
import { courseStats, getCategory, getCourse, getInstructor, listCourses } from "@/lib/catalog/repository";
import type { LessonType } from "@/lib/catalog/types";
import { formatDuration } from "@/lib/utils";

export async function generateStaticParams() {
  return (await listCourses()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return { title: "Course not found" };
  return { title: course.title, description: course.subtitle };
}

const LESSON_ICON: Record<LessonType, typeof PlayCircle> = {
  video: PlayCircle,
  reading: FileText,
  quiz: ListChecks,
  assignment: PenLine,
};

const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [category, instructor] = await Promise.all([
    getCategory(course.categorySlug),
    getInstructor(course.instructorSlug),
  ]);
  const stats = courseStats(course);

  return (
    <>
      <section className="bg-ink text-white">
        <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-white/60">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/courses" className="hover:text-white">
                    Courses
                  </Link>
                </li>
                {category && (
                  <>
                    <li aria-hidden>/</li>
                    <li>
                      <Link href={`/categories/${category.slug}`} className="hover:text-white">
                        {category.name}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>
            <h1 className="mt-5 max-w-3xl font-display text-4xl leading-[1.08] font-medium tracking-[-0.015em] sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">{course.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone="inverse">{LEVEL_LABEL[course.level]}</Badge>
              {course.includedInMembership && <Badge tone="inverse">Included in membership</Badge>}
              {course.isSample && <SampleBadge />}
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
              {instructor && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Instructor</dt>
                  <dd>
                    By{" "}
                    <Link
                      href={`/instructors/${instructor.slug}`}
                      className="text-white underline-offset-4 hover:underline"
                    >
                      {instructor.displayName}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <dt>
                  <Globe className="size-4" aria-label="Language" />
                </dt>
                <dd>{course.language}</dd>
              </div>
              <div>
                <dt className="inline">Last updated </dt>
                <dd className="inline">{dateFmt.format(new Date(`${course.updatedAt}T00:00:00Z`))}</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="font-display text-3xl font-medium text-ink">
              What you’ll learn
            </h2>
            <ul className="mt-6 grid gap-x-8 gap-y-3 rounded-lg border border-line bg-surface p-6 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5 text-[15px] text-text">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="about">
            <h2 id="about" className="font-display text-3xl font-medium text-ink">
              About this course
            </h2>
            <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-muted">{course.description}</p>
          </section>

          <section aria-labelledby="curriculum">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="curriculum" className="font-display text-3xl font-medium text-ink">
                Curriculum
              </h2>
              <p className="text-sm text-muted">
                {stats.moduleCount} modules · {stats.lessonCount} lessons · {formatDuration(stats.totalMinutes)}
              </p>
            </div>
            <Accordion
              type="multiple"
              defaultValue={[course.modules[0]?.id ?? ""]}
              className="mt-6 rounded-lg border border-line bg-surface px-5"
            >
              {course.modules.map((m, mi) => {
                const minutes = m.lessons.reduce((s, l) => s + l.durationMinutes, 0);
                return (
                  <AccordionItem key={m.id} value={m.id}>
                    <AccordionTrigger>
                      <span className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                        <span>
                          Module {mi + 1}: {m.title}
                        </span>
                        <span className="text-sm font-normal text-subtle">
                          {m.lessons.length} lessons · {formatDuration(minutes)}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="divide-y divide-line rounded-md border border-line">
                        {m.lessons.map((l) => {
                          const Icon = LESSON_ICON[l.type];
                          return (
                            <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-[15px]">
                              <Icon className="size-4 shrink-0 text-subtle" aria-hidden />
                              <span className="min-w-0 flex-1 text-text">
                                {l.title}
                                {l.isPreview && (
                                  <span className="mt-0.5 block text-xs font-medium text-success sm:hidden">
                                    Free preview
                                  </span>
                                )}
                              </span>
                              {l.isPreview && (
                                <Badge tone="success" className="hidden sm:inline-flex">
                                  Free preview
                                </Badge>
                              )}
                              <span className="w-14 text-right text-sm text-subtle tabular-nums">
                                {l.durationMinutes} min
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>

          <section aria-labelledby="requirements" className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 id="requirements" className="text-lg font-semibold text-text">
                Requirements
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
                {course.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Who this course is for</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
                {course.audience.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </section>

          {instructor && (
            <section aria-labelledby="instructor" className="rounded-lg border border-line bg-surface p-6 sm:p-8">
              <h2 id="instructor" className="text-sm font-medium text-subtle">
                Your instructor
              </h2>
              <div className="mt-4 flex flex-col gap-5 sm:flex-row">
                <Avatar name={instructor.displayName} hue={(instructor.slug.length * 47) % 360} />
                <div>
                  <p className="flex items-center gap-2 text-lg font-semibold text-text">
                    <Link href={`/instructors/${instructor.slug}`} className="hover:text-primary-ink">
                      {instructor.displayName}
                    </Link>
                    {instructor.isSample && <SampleBadge />}
                  </p>
                  <p className="text-muted">{instructor.headline}</p>
                  <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-muted">{instructor.bio}</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Purchase card — moves above the fold on desktop via negative margin */}
        <aside className="order-first lg:order-none lg:-mt-80">
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-pop lg:sticky lg:top-24">
            <CourseCover seed={course.id} hue={category?.hue ?? 240} />
            <div className="p-6">
              <Price course={course} size="lg" />
              <div className="mt-5 space-y-2.5">
                <Button className="w-full" size="lg" disabled aria-describedby="enrol-status">
                  {course.priceMinor === 0 ? "Enrol for free" : "Buy course"}
                </Button>
                {course.includedInMembership && (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href="/pricing">Get it with membership</Link>
                  </Button>
                )}
              </div>
              <p id="enrol-status" className="mt-3 text-center text-xs text-subtle">
                Enrolment opens once accounts and payments are connected.
              </p>
              <ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <Layers className="size-4 text-subtle" aria-hidden />
                  {stats.moduleCount} modules
                </li>
                <li className="flex items-center gap-2.5">
                  <BookOpen className="size-4 text-subtle" aria-hidden />
                  {stats.lessonCount} lessons, {stats.previewCount} free{" "}
                  {stats.previewCount === 1 ? "preview" : "previews"}
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 text-subtle" aria-hidden />
                  {formatDuration(stats.totalMinutes)} of content
                </li>
                <li className="flex items-center gap-2.5">
                  <BarChart3 className="size-4 text-subtle" aria-hidden />
                  {LEVEL_LABEL[course.level]} level
                </li>
              </ul>
            </div>
          </div>
          {course.isSample && (
            <Notice tone="warning" className="mt-4">
              This is a development sample course used to preview the page layout.
            </Notice>
          )}
        </aside>
      </Container>
    </>
  );
}
