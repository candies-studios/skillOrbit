import { SearchX } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/lib/catalog/types";
import { getCatalogLookups } from "@/lib/catalog/lookups";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./cards";

export async function CourseGrid({
  courses,
  emptyTitle = "No courses match these filters",
  emptyDescription = "Try a broader keyword or clear a filter.",
}: {
  courses: Course[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Button asChild variant="secondary">
            <Link href="/courses">See all courses</Link>
          </Button>
        }
      />
    );
  }
  const { categoryBySlug, instructorBySlug } = await getCatalogLookups();
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <li key={c.id} className="flex">
          <CourseCard
            course={c}
            category={categoryBySlug.get(c.categorySlug)}
            instructor={instructorBySlug.get(c.instructorSlug)}
          />
        </li>
      ))}
    </ul>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading courses">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-lg border border-line bg-surface">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
