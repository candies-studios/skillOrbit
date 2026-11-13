"use client";

import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import Link from "next/link";
import type { Category, Course, Instructor } from "@/lib/catalog/types";
import { filterCourses, parseCourseQuery } from "@/lib/catalog/repository";
import { EmptyState } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./cards";
import { CourseFilters, SortLinks } from "./course-filters";

/**
 * Catalogue filtering runs in the browser from URL params, so the page can
 * be statically exported (GitHub Pages) as well as server-rendered. Input is
 * validated by the same parseCourseQuery used everywhere else.
 */
export function Catalogue({
  courses,
  categories,
  instructors,
}: {
  courses: Course[];
  categories: Category[];
  instructors: Instructor[];
}) {
  const params = useSearchParams();
  const query = parseCourseQuery(
    Object.fromEntries(params.entries()),
    categories.map((c) => c.slug),
  );
  const results = filterCourses(courses, query);
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const instructorBySlug = new Map(instructors.map((i) => [i.slug, i]));

  return (
    <>
      <CourseFilters key={params.toString()} query={query} categories={categories} />
      <div className="mt-8 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {results.length} {results.length === 1 ? "course" : "courses"}
          {query.q && (
            <>
              {" "}
              for <span className="font-medium text-text">“{query.q}”</span>
            </>
          )}
        </p>
        <SortLinks query={query} />
      </div>
      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No courses match these filters"
          description="Try a broader keyword or clear a filter."
          action={
            <Button asChild variant="secondary">
              <Link href="/courses">See all courses</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id} className="flex">
              <CourseCard
                course={c}
                category={categoryBySlug.get(c.categorySlug)}
                instructor={instructorBySlug.get(c.instructorSlug)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
