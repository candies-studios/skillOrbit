import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, SectionHeading } from "@/components/layout/primitives";
import { PricingCard } from "@/components/catalog/cards";
import { Notice } from "@/components/ui/feedback";
import { FaqList } from "@/components/marketing/faq-list";
import { faqGroups } from "@/content/faq";
import { listCourses, listMembershipPlans } from "@/lib/catalog/repository";

export const metadata: Metadata = {
  title: "Membership",
  description: "One membership for every membership-eligible course. Monthly or annual.",
};

export default async function PricingPage() {
  const [plans, eligible, all] = await Promise.all([
    listMembershipPlans(),
    listCourses({ price: "membership" }),
    listCourses(),
  ]);
  const paymentFaq = faqGroups.find((g) => g.id === "payments")!;

  return (
    <>
      <PageHeader
        title="Membership"
        description={`Learn across every category with one plan. ${eligible.length} of ${all.length} courses in the current catalogue are included.`}
      />
      <Container className="py-12 sm:py-16">
        <Notice
          id="checkout-status"
          tone="unconfigured"
          title="Membership checkout isn't live yet"
          className="mb-8 max-w-3xl"
        >
          Plans and prices below are development samples. Subscriptions will open once payments are connected and
          tested; the final prices will be set by the platform admin.
        </Notice>
        <div className="grid max-w-4xl gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <PricingCard
              key={p.id}
              plan={p}
              // Integer division in minor units; floor so we never overstate the saving.
              monthlyEquivalentOf={p.interval === "year" ? Math.floor(p.priceMinor / 12) : undefined}
            />
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-subtle">
          Prices are in Indian rupees. Applicable taxes will be shown at checkout. See the{" "}
          <Link href="/legal/refunds" className="text-primary underline underline-offset-4">
            refund and cancellation policy
          </Link>
          .
        </p>

        <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading title="Questions about membership" className="self-start" />
          <FaqList items={paymentFaq.items} idPrefix="pricing" />
        </section>
      </Container>
    </>
  );
}
