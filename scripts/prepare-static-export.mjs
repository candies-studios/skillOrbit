#!/usr/bin/env node
/**
 * Prepares a CI checkout for the GitHub Pages static preview.
 *
 * RUN ONLY IN CI (the GitHub Pages workflow) — it deletes server-only files
 * from the working tree. It refuses to run unless CI=true.
 *
 *  - proxy.ts         Proxy can't run on a static host (Pages serves 404.html itself)
 *  - app/(app)        signed-in dashboards, instructor and admin areas (need a server)
 *  - app/auth         email confirmation route handler (needs a server)
 *  - robots.ts        replaced by a static robots.txt that blocks indexing,
 *  - sitemap.ts       because the preview shows sample data and must not be indexed
 */
import { rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

if (process.env.CI !== "true") {
  console.error("prepare-static-export: refusing to run outside CI (it deletes files). Set CI=true to override.");
  process.exit(1);
}

for (const f of ["src/proxy.ts", "src/app/robots.ts", "src/app/sitemap.ts", "src/app/(app)", "src/app/auth"]) {
  if (existsSync(f)) {
    rmSync(f, { recursive: true });
    console.log(`removed ${f} for static export`);
  }
}

// The cached catalogue loader uses "use cache", which needs Cache Components
// (unavailable in static export). The preview has no database, so stub it.
writeFileSync(
  "src/lib/catalog/catalog-cache.ts",
  `import type { CatalogSnapshot } from "./db";
export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  throw new Error("The database catalogue is not available in the static preview.");
}
`,
);
console.log("stubbed src/lib/catalog/catalog-cache.ts for static export");

mkdirSync("public", { recursive: true }); // a fresh checkout may have no public/ folder
writeFileSync(
  "public/robots.txt",
  "# Static preview with sample data — not for indexing\nUser-agent: *\nDisallow: /\n",
);
writeFileSync("public/.nojekyll", "");
console.log("wrote public/robots.txt and public/.nojekyll");
