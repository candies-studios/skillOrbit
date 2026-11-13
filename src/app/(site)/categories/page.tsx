import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/layout/primitives";
import { CategoryTile } from "@/components/catalog/cards";
import { countCoursesByCategory, listCategories } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore course categories: AI, digital marketing, freelancing, e-commerce, content creation and business finance.",
};

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([listCategories(), countCoursesByCategory()]);
  return (
    <>
      <PageHeader
        title="Categories"
        description="Pick an area to see its courses, from first steps to advanced practice."
      />
      <Container className="py-12 sm:py-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.slug}>
              <CategoryTile category={c} count={counts[c.slug] ?? 0} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
