import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, SectionHeading } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { FaqList } from "@/components/marketing/faq-list";
import { faqGroups } from "@/content/faq";

export const metadata: Metadata = {
  title: "Affiliate programme",
  description: "Recommend SkillOrbit courses and earn commission on referred sales.",
};

/** This is a real sequence (apply → share → earn → get paid), so steps are numbered. */
const STEPS = [
  { title: "Apply", body: "Create an account and submit a short application describing where you'll share links." },
  { title: "Share your links", body: "Once approved, generate links for the whole site or for a specific course." },
  {
    title: "Earn on referred sales",
    body: "A purchase within the attribution window records a commission as pending in your ledger.",
  },
  {
    title: "Get paid",
    body: "After the holding period, commissions become payable. Request a payout and our team reviews it.",
  },
];

const RULES = [
  "You can't earn commission on your own purchases.",
  "Each order earns at most one commission.",
  "Commissions on refunded or charged-back orders are reversed.",
  "Commission rates can differ by course and are fixed at the time of each sale.",
  "Misleading claims about earnings or course outcomes aren't allowed.",
];

export default function AffiliatesPage() {
  const faq = faqGroups.find((g) => g.id === "teaching")!.items.filter((i) => /affiliate|roles|same time/i.test(i.q));
  return (
    <>
      <PageHeader
        title="Affiliate programme"
        description="Recommend courses you believe in. When someone you refer buys, you earn a share of the sale."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/register?intent=affiliate">Create an account to apply</Link>
          </Button>
        </div>
      </PageHeader>
      <Container className="py-14 sm:py-20">
        <SectionHeading title="How it works" />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-5">
              <span className="font-display text-3xl text-primary">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-text">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading
            className="self-start"
            title="Programme rules"
            description="The full affiliate terms are shown when you apply."
          />
          <div>
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {RULES.map((r) => (
                <li key={r} className="px-5 py-4 text-text">
                  {r}
                </li>
              ))}
            </ul>
            <Notice tone="info" className="mt-5">
              Commission rates, the attribution window and the holding period are set by the platform admin and shown in
              your affiliate dashboard. Earnings depend entirely on the sales you refer; none are guaranteed.
            </Notice>
          </div>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading className="self-start" title="Common questions" />
          <FaqList items={faq} idPrefix="aff" />
        </div>
      </Container>
    </>
  );
}
