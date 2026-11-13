import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageHeader } from "@/components/layout/primitives";
import { CourseFilters, SortLinks } from "@/components/catalog/course-filters";
import { CourseGrid, CourseGridSkeleton } from "@/components/catalog/course-grid";
import { listCategories, listCourses, parseCourseQuery } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse practical courses in AI, marketing, freelancing, e-commerce, content and business finance.",
};

async function Results({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const categories = await listCategories();
  const query = parseCourseQuery(
    await searchParams,
    categories.map((c) => c.slug),
  );
  const courses = await listCourses(query);
  return (
    <>
      <CourseFilters query={query} categories={categories} />
      <div className="mt-8 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {courses.length} {courses.length === 1 ? "course" : "courses"}
          {query.q && (
            <>
              {" "}
              for <span className="font-medium text-text">“{query.q}”</span>
            </>
          )}
        </p>
        <SortLinks query={query} />
      </div>
      <CourseGrid courses={courses} />
    </>
  );
}

export default function CoursesPage(props: PageProps<"/courses">) {
  return (
    <>
      <PageHeader
        title="Course catalogue"
        description="Short, practical courses. Preview lessons are free to watch on every course page."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CourseGridSkeleton />}>
          <Results searchParams={props.searchParams} />
        </Suspense>
      </Container>
    </>
  );
}
