import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";
import { isKnownSlug, type SlugKind } from "@/lib/catalog/slug-index";

/**
 * Runs before every matched request:
 *  1. Refreshes the Supabase session cookie (required by @supabase/ssr).
 *  2. Sends signed-out visitors away from account areas (pages re-check too).
 *  3. Returns a real 404 for unknown catalogue slugs — with Cache Components
 *     a prerendered shell would otherwise commit a 200 before notFound().
 */
const PROTECTED = ["/dashboard", "/instructor", "/admin"];
const KIND_BY_SEGMENT: Record<string, SlugKind> = {
  courses: "course",
  categories: "category",
  instructors: "instructor",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 3. Unknown catalogue slugs → not-found page with 404 status.
  const [, segment, slug, ...rest] = pathname.split("/");
  const kind = segment ? KIND_BY_SEGMENT[segment] : undefined;
  if (kind && slug && rest.length === 0 && !(await isKnownSlug(kind, decodeURIComponent(slug)))) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }

  const env = supabaseEnv();
  if (!env) return NextResponse.next();

  // 1. Session refresh (pattern from @supabase/ssr docs).
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Account areas need a session.
  if (!user && PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)",
  ],
};
