import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageHeader } from "@/components/layout/primitives";
import { CourseGridSkeleton } from "@/components/catalog/course-grid";
import { Catalogue } from "@/components/catalog/catalogue";
import { listCategories, listCourses, listInstructors } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse practical courses in AI, marketing, freelancing, e-commerce, content and business finance.",
};

export default async function CoursesPage() {
  const [courses, categories, instructors] = await Promise.all([listCourses(), listCategories(), listInstructors()]);
  return (
    <>
      <PageHeader
        title="Course catalogue"
        description="Short, practical courses. Preview lessons are free to watch on every course page."
      />
      <Container className="py-10 sm:py-14">
        <Suspense fallback={<CourseGridSkeleton />}>
          <Catalogue courses={courses} categories={categories} instructors={instructors} />
        </Suspense>
      </Container>
    </>
  );
}
