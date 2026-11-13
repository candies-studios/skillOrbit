import { describe, expect, it } from "vitest";
import { courseStats, filterCourses, parseCourseQuery } from "@/lib/catalog/repository";
import { categories, courses, instructors } from "@/lib/catalog/seed";
import type { Course } from "@/lib/catalog/types";

const slugs = categories.map((c) => c.slug);

describe("parseCourseQuery", () => {
  it("accepts valid values", () => {
    expect(
      parseCourseQuery({ q: " seo ", category: "ai", level: "beginner", price: "free", sort: "title" }, slugs),
    ).toEqual({
      q: "seo",
      category: "ai",
      level: "beginner",
      price: "free",
      sort: "title",
    });
  });
  it("drops unknown or malicious values", () => {
    expect(parseCourseQuery({ category: "<script>", level: "expert", price: "x", sort: "evil" }, slugs)).toEqual({
      q: undefined,
      category: undefined,
      level: undefined,
      price: undefined,
      sort: undefined,
    });
  });
  it("uses the first value of repeated params and caps keyword length", () => {
    const q = parseCourseQuery({ q: ["a".repeat(500), "b"] }, slugs);
    expect(q.q).toHaveLength(100);
  });
});

describe("filterCourses", () => {
  it("never returns unpublished courses", () => {
    const draft: Course = { ...courses[0]!, id: "draft", slug: "draft", status: "draft" };
    const result = filterCourses([...courses, draft], {});
    expect(result.find((c) => c.id === "draft")).toBeUndefined();
  });
  it("filters by category, level and price", () => {
    expect(filterCourses(courses, { category: "ai" }).every((c) => c.categorySlug === "ai")).toBe(true);
    expect(filterCourses(courses, { level: "advanced" }).every((c) => c.level === "advanced")).toBe(true);
    expect(filterCourses(courses, { price: "free" }).every((c) => c.priceMinor === 0)).toBe(true);
    expect(filterCourses(courses, { price: "paid" }).every((c) => c.priceMinor > 0)).toBe(true);
    expect(filterCourses(courses, { price: "membership" }).every((c) => c.includedInMembership)).toBe(true);
  });
  it("searches case-insensitively across title and outcomes", () => {
    expect(filterCourses(courses, { q: "SEO" }).map((c) => c.slug)).toContain("seo-that-lasts");
  });
  it("sorts by price ascending and descending", () => {
    const asc = filterCourses(courses, { sort: "price-asc" }).map((c) => c.priceMinor);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    const desc = filterCourses(courses, { sort: "price-desc" }).map((c) => c.priceMinor);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });
});

describe("seed data integrity", () => {
  it("stores every price as integer minor units", () => {
    for (const c of courses) {
      expect(Number.isSafeInteger(c.priceMinor)).toBe(true);
      if (c.compareAtPriceMinor !== null) expect(Number.isSafeInteger(c.compareAtPriceMinor)).toBe(true);
    }
  });
  it("marks every seeded course and instructor as sample data", () => {
    expect(courses.every((c) => c.isSample)).toBe(true);
    expect(instructors.every((i) => i.isSample)).toBe(true);
  });
  it("references existing categories and instructors, with unique slugs", () => {
    const instructorSlugs = new Set(instructors.map((i) => i.slug));
    for (const c of courses) {
      expect(slugs).toContain(c.categorySlug);
      expect(instructorSlugs.has(c.instructorSlug)).toBe(true);
    }
    expect(new Set(courses.map((c) => c.slug)).size).toBe(courses.length);
  });
  it("computes course stats from lessons", () => {
    const s = courseStats(courses[0]!);
    expect(s.lessonCount).toBe(courses[0]!.modules.flatMap((m) => m.lessons).length);
    expect(s.totalMinutes).toBeGreaterThan(0);
  });
});
