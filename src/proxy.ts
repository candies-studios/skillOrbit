import { NextResponse, type NextRequest } from "next/server";
import { isKnownSlug, type SlugKind } from "@/lib/catalog/slug-index";

/**
 * With Cache Components, unknown dynamic params are served from a
 * prerendered shell, which commits a 200 status before the page can call
 * notFound(). To return a true 404 for unknown catalogue URLs, we check the
 * slug here, before rendering starts, and rewrite to an unmatched path so
 * the app's not-found page renders with a 404 status.
 *
 * Keep this check fast — it must never query full records.
 */
const KIND_BY_SEGMENT: Record<string, SlugKind> = {
  courses: "course",
  categories: "category",
  instructors: "instructor",
};

export function proxy(request: NextRequest) {
  const [, segment, slug, ...rest] = request.nextUrl.pathname.split("/");
  const kind = segment ? KIND_BY_SEGMENT[segment] : undefined;
  if (!kind || !slug || rest.length > 0) return NextResponse.next();
  if (isKnownSlug(kind, decodeURIComponent(slug))) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-found", request.url));
}

export const config = {
  matcher: ["/courses/:slug", "/categories/:slug", "/instructors/:slug"],
};
