import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CATALOG_TAG, fetchCatalogSnapshot, type CatalogSnapshot } from "./db";

/**
 * Cached catalogue snapshot, invalidated by updateTag(CATALOG_TAG) whenever
 * an admin or instructor action changes public data.
 *
 * This is the only "use cache" function in the app. The GitHub Pages static
 * build (no server, no Cache Components) swaps this file for a stub — see
 * scripts/prepare-static-export.mjs.
 */
export async function loadCatalogSnapshot(): Promise<CatalogSnapshot> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return fetchCatalogSnapshot();
}
