import Form from "next/form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * GET form to /courses — works without JavaScript; next/form adds
 * client-side navigation when JS is available.
 */
export function CourseSearchForm({
  defaultValue,
  className,
  size = "lg",
}: {
  defaultValue?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <Form action="/courses" role="search" className={cn("flex w-full gap-2", className)}>
      <label htmlFor="course-search" className="sr-only">
        Search courses
      </label>
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <input
          id="course-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={100}
          placeholder="Search for a skill, e.g. SEO or freelancing"
          className={cn(
            "w-full rounded-md border border-line-strong bg-surface pr-3 pl-10 text-[15px] text-text placeholder:text-subtle focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 focus-visible:outline-none",
            size === "lg" ? "h-12" : "h-11",
          )}
        />
      </div>
      <Button type="submit" size={size === "lg" ? "lg" : "md"}>
        Search
      </Button>
    </Form>
  );
}
