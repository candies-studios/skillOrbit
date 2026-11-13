import type { CurrencyCode } from "@/lib/money";

/**
 * Public catalog types. These mirror the Phase 2 Supabase tables
 * (categories, courses, course_modules, lessons, instructor_profiles,
 * membership_plans) so swapping the seed source for Supabase does not
 * change any page.
 */

export type CategorySlug =
  "ai" | "digital-marketing" | "freelancing" | "online-business" | "content-creation" | "business-finance";

export type Category = {
  id: string;
  slug: CategorySlug;
  name: string;
  shortName: string;
  description: string;
  /** Hue used for generated cover art; a design token, not a brand colour. */
  hue: number;
  sortOrder: number;
};

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonType = "video" | "reading" | "quiz" | "assignment";
export type CourseStatus = "draft" | "in_review" | "published" | "rejected" | "archived";

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  durationMinutes: number;
  isPreview: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  categorySlug: CategorySlug;
  instructorSlug: string;
  level: CourseLevel;
  language: string;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: CurrencyCode;
  includedInMembership: boolean;
  outcomes: string[];
  requirements: string[];
  audience: string[];
  modules: CourseModule[];
  status: CourseStatus;
  isFeatured: boolean;
  publishedAt: string;
  updatedAt: string;
  /** True for development seed records. Rendered with a visible label. */
  isSample: boolean;
};

export type Instructor = {
  id: string;
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  expertise: string[];
  location: string;
  isFeatured: boolean;
  isSample: boolean;
};

export type BillingInterval = "month" | "year";

export type MembershipPlan = {
  id: string;
  code: string;
  name: string;
  interval: BillingInterval;
  priceMinor: number;
  currency: CurrencyCode;
  description: string;
  benefits: string[];
  isHighlighted: boolean;
  isSample: boolean;
};

export type CourseSort = "newest" | "price-asc" | "price-desc" | "title";
export type PriceFilter = "all" | "free" | "paid" | "membership";

export type CourseQuery = {
  q?: string;
  category?: CategorySlug;
  level?: CourseLevel;
  price?: PriceFilter;
  sort?: CourseSort;
};
