import type { Category, Instructor } from "./types";
import { listCategories, listInstructors } from "./repository";

/** Loads category and instructor lookup maps for rendering course cards. */
export async function getCatalogLookups() {
  const [cats, insts] = await Promise.all([listCategories(), listInstructors()]);
  return {
    categories: cats,
    categoryBySlug: new Map<string, Category>(cats.map((c) => [c.slug, c])),
    instructorBySlug: new Map<string, Instructor>(insts.map((i) => [i.slug, i])),
  };
}
