import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/primitives";
import { InstructorCard } from "@/components/catalog/cards";
import { Button } from "@/components/ui/button";
import { listCoursesByInstructor, listInstructors } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Instructors",
  description: "Meet the practitioners who teach on SkillOrbit.",
};

export default async function InstructorsPage() {
  const instructors = await listInstructors();
  const counts = await Promise.all(instructors.map(async (i) => (await listCoursesByInstructor(i.slug)).length));
  return (
    <>
      <PageHeader
        title="Instructors"
        description="Every instructor is reviewed before they can publish, and every course is checked before it goes live."
      >
        <Button asChild variant="secondary">
          <Link href="/teach">Apply to teach</Link>
        </Button>
      </PageHeader>
      <Container className="py-12 sm:py-16">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {instructors.map((i, idx) => (
            <li key={i.slug} className="flex [&>*]:flex-1">
              <InstructorCard instructor={i} courseCount={counts[idx] ?? 0} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
