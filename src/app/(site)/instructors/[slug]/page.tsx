import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Container } from "@/components/layout/primitives";
import { Avatar } from "@/components/catalog/cards";
import { CourseGrid } from "@/components/catalog/course-grid";
import { Badge, SampleBadge } from "@/components/ui/feedback";
import { getInstructor, listCoursesByInstructor, listInstructors } from "@/lib/catalog/repository";

export async function generateStaticParams() {
  return (await listInstructors()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/instructors/[slug]">): Promise<Metadata> {
  const i = await getInstructor((await params).slug);
  return i ? { title: i.displayName, description: i.headline } : { title: "Instructor not found" };
}

export default async function InstructorPage({ params }: PageProps<"/instructors/[slug]">) {
  const instructor = await getInstructor((await params).slug);
  if (!instructor) notFound();
  const courses = await listCoursesByInstructor(instructor.slug);
  return (
    <>
      <header className="border-b border-line bg-surface">
        <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-center sm:py-16">
          <Avatar name={instructor.displayName} hue={(instructor.slug.length * 47) % 360} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-medium tracking-[-0.015em] text-ink sm:text-5xl">
                {instructor.displayName}
              </h1>
              {instructor.isSample && <SampleBadge />}
            </div>
            <p className="mt-2 text-lg text-muted">{instructor.headline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-subtle">
              <MapPin className="size-4" aria-hidden /> {instructor.location}
            </p>
          </div>
        </Container>
      </header>
      <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[20rem_1fr]">
        <aside className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-subtle">About</h2>
            <p className="mt-2 leading-relaxed text-muted">{instructor.bio}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-subtle">Teaches</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {instructor.expertise.map((e) => (
                <li key={e}>
                  <Badge>{e}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <section aria-labelledby="courses-by">
          <h2 id="courses-by" className="mb-6 font-display text-3xl font-medium text-ink">
            Courses
          </h2>
          <CourseGrid
            courses={courses}
            emptyTitle="No published courses yet"
            emptyDescription="This instructor's courses will appear here once they're reviewed and published."
          />
        </section>
      </Container>
    </>
  );
}
