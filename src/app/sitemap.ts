import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { listCategories, listCourses, listInstructors } from "@/lib/catalog/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.siteUrl.replace(/\/$/, "");
  const statics = [
    "",
    "/courses",
    "/categories",
    "/instructors",
    "/pricing",
    "/affiliates",
    "/teach",
    "/about",
    "/contact",
    "/faq",
    "/legal/terms",
    "/legal/privacy",
    "/legal/refunds",
  ];
  const [courses, categories, instructors] = await Promise.all([listCourses(), listCategories(), listInstructors()]);
  return [
    ...statics.map((p) => ({ url: `${base}${p}` })),
    ...courses.map((c) => ({ url: `${base}/courses/${c.slug}`, lastModified: c.updatedAt })),
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}` })),
    ...instructors.map((i) => ({ url: `${base}/instructors/${i.slug}` })),
  ];
}
