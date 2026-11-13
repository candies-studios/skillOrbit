import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/primitives";
import { FaqList } from "@/components/marketing/faq-list";
import { faqGroups } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about courses, payments, membership, teaching and affiliates.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        title="Frequently asked questions"
        description={
          <>
            Can’t find what you need?{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Contact us
            </Link>
            .
          </>
        }
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="FAQ sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {faqGroups.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="block rounded-md px-3 py-2 text-muted hover:bg-surface hover:text-ink">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-14">
          {faqGroups.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="scroll-mt-24">
              <h2 id={`${g.id}-h`} className="mb-5 font-display text-3xl font-medium text-ink">
                {g.title}
              </h2>
              <FaqList items={g.items} idPrefix={g.id} />
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
