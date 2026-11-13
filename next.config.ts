import type { NextConfig } from "next";

/**
 * STATIC_EXPORT=true builds a static preview of the public site (used by
 * the GitHub Pages workflow). Server features — proxy, server actions,
 * auth, payments — are unavailable in that mode, so the production app
 * (Phase 2+) must be deployed to a server platform such as Vercel.
 *
 * PAGES_BASE_PATH is the sub-path the site is served from, e.g. "/skillOrbit"
 * for https://<owner>.github.io/skillOrbit/.
 */
const isStaticExport = process.env.STATIC_EXPORT === "true";
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prerendering need a server; a fully static
  // export gains nothing from them and Next's export checks reject them.
  cacheComponents: !isStaticExport,
  partialPrefetching: !isStaticExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(isStaticExport && {
    output: "export",
    basePath,
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
