import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader } from "@/components/layout/primitives";
import { CourseGrid } from "@/components/catalog/course-grid";
import { getCategory, listCategories, listCourses } from "@/lib/catalog/repository";

export async function generateStaticParams() {
  return (await listCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  return category ? { title: category.name, description: category.description } : { title: "Category not found" };
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  const [courses, all] = await Promise.all([listCourses({ category: category.slug }), listCategories()]);
  return (
    <>
      <PageHeader title={category.name} description={category.description}>
        <nav aria-label="Other categories">
          <ul className="flex flex-wrap gap-2">
            {all.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  aria-current={c.slug === category.slug ? "page" : undefined}
                  className={
                    c.slug === category.slug
                      ? "inline-block rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-white"
                      : "inline-block rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-muted hover:border-ink-3 hover:text-ink"
                  }
                >
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <Container className="py-12 sm:py-16">
        <CourseGrid
          courses={courses}
          emptyTitle="No courses in this category yet"
          emptyDescription="New courses are reviewed before they're published. Browse other categories in the meantime."
        />
      </Container>
    </>
  );
}
