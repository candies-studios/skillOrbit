import Form from "next/form";
import Link from "next/link";
import type { Category, CourseQuery } from "@/lib/catalog/types";
import { Select, Label } from "@/components/ui/form-controls";
import { Button } from "@/components/ui/button";

/**
 * Filter bar for the catalogue. A plain GET form so filters live in the
 * URL (shareable, back-button friendly, works without JS).
 */
export function CourseFilters({ query, categories }: { query: CourseQuery; categories: Category[] }) {
  const active = Boolean(query.q || query.category || query.level || (query.price && query.price !== "all"));
  return (
    <Form
      action="/courses"
      className="grid gap-4 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="space-y-1.5">
        <Label htmlFor="f-q">Keyword</Label>
        <input
          id="f-q"
          name="q"
          type="search"
          defaultValue={query.q}
          maxLength={100}
          placeholder="Any keyword"
          className="h-11 w-full rounded-md border border-line-strong bg-surface px-3.5 text-[15px] placeholder:text-subtle focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 focus-visible:outline-none"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-category">Category</Label>
        <Select id="f-category" name="category" defaultValue={query.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-level">Level</Label>
        <Select id="f-level" name="level" defaultValue={query.level ?? ""}>
          <option value="">Any level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-price">Price</Label>
        <Select id="f-price" name="price" defaultValue={query.price ?? "all"}>
          <option value="all">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="membership">In membership</option>
        </Select>
      </div>
      <input type="hidden" name="sort" value={query.sort ?? ""} />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="flex-1 lg:flex-none">
          Apply filters
        </Button>
        {active && (
          <Button asChild variant="ghost">
            <Link href="/courses">Clear</Link>
          </Button>
        )}
      </div>
    </Form>
  );
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title", label: "Title A–Z" },
] as const;

/** Sort links preserve the other filters. */
export function SortLinks({ query }: { query: CourseQuery }) {
  const current = query.sort ?? "newest";
  const href = (sort: string) => {
    const p = new URLSearchParams();
    if (query.q) p.set("q", query.q);
    if (query.category) p.set("category", query.category);
    if (query.level) p.set("level", query.level);
    if (query.price && query.price !== "all") p.set("price", query.price);
    if (sort !== "newest") p.set("sort", sort);
    const s = p.toString();
    return s ? `/courses?${s}` : "/courses";
  };
  return (
    <nav aria-label="Sort courses" className="flex flex-wrap items-center gap-1 text-sm">
      <span className="mr-1 text-subtle">Sort:</span>
      {SORT_OPTIONS.map((o) => (
        <Link
          key={o.value}
          href={href(o.value)}
          aria-current={current === o.value ? "true" : undefined}
          className={
            current === o.value
              ? "rounded-md bg-primary-soft px-2.5 py-1 font-medium text-primary-ink"
              : "rounded-md px-2.5 py-1 text-muted hover:bg-paper hover:text-ink"
          }
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
