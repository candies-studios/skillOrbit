#!/usr/bin/env node
/**
 * Prepares a CI checkout for the GitHub Pages static preview.
 *
 * RUN ONLY IN CI (the GitHub Pages workflow) — it deletes server-only files
 * from the working tree. It refuses to run unless CI=true.
 *
 *  - proxy.ts         Proxy can't run on a static host (Pages serves 404.html itself)
 *  - robots.ts        replaced by a static robots.txt that blocks indexing,
 *  - sitemap.ts       because the preview shows sample data and must not be indexed
 */
import { rmSync, writeFileSync, existsSync } from "node:fs";

if (process.env.CI !== "true") {
  console.error("prepare-static-export: refusing to run outside CI (it deletes files). Set CI=true to override.");
  process.exit(1);
}

for (const f of ["src/proxy.ts", "src/app/robots.ts", "src/app/sitemap.ts"]) {
  if (existsSync(f)) {
    rmSync(f);
    console.log(`removed ${f} for static export`);
  }
}

writeFileSync(
  "public/robots.txt",
  "# Static preview with sample data — not for indexing\nUser-agent: *\nDisallow: /\n",
);
writeFileSync("public/.nojekyll", "");
console.log("wrote public/robots.txt and public/.nojekyll");
