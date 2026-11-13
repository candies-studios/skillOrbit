import { CATALOG_SOURCE } from "@/lib/catalog/repository";

/** Site-wide strip shown while the catalog reads development seed data. */
export function SeedDataBanner() {
  if (CATALOG_SOURCE !== "development-seed") return null;
  return (
    <div className="bg-marigold-soft text-center text-[13px] text-marigold-ink">
      <p className="mx-auto max-w-7xl px-5 py-2">
        Preview build: courses, instructors and prices shown are development samples, not live listings.
      </p>
    </div>
  );
}
