import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/catalog/course-view";
import { EnrolActions } from "@/components/catalog/enrol-actions";
import {
  getCategory,
  getCourse,
  getInstructor,
  listCourses,
  staticParamsOrPlaceholder,
} from "@/lib/catalog/repository";

export async function generateStaticParams() {
  return staticParamsOrPlaceholder((await listCourses()).map((c) => c.slug));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  if (!course) return { title: "Course not found" };
  return { title: course.title, description: course.subtitle };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const course = await getCourse((await params).slug);
  if (!course) notFound();
  const [category, instructor] = await Promise.all([
    getCategory(course.categorySlug),
    getInstructor(course.instructorSlug),
  ]);
  return (
    <CourseView
      course={course}
      category={category}
      instructor={instructor}
      purchase={
        <EnrolActions
          courseId={course.id}
          slug={course.slug}
          isFree={course.priceMinor === 0}
          includedInMembership={course.includedInMembership}
        />
      }
    />
  );
}
