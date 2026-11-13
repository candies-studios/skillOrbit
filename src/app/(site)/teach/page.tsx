import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader, SectionHeading } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Teach on SkillOrbit",
  description: "Apply to publish practical courses and earn a share of every sale.",
};

const STEPS = [
  { title: "Apply", body: "Tell us what you teach and share examples of your work." },
  { title: "Get approved", body: "Our team reviews your application and agrees your revenue share with you." },
  { title: "Build your course", body: "Create modules and lessons, upload videos and resources, and set your price." },
  { title: "Submit for review", body: "We check each course for quality and accuracy before it's published." },
  { title: "Earn", body: "Your share of every sale is recorded in your earnings ledger, net of refunds." },
];

export default function TeachPage() {
  return (
    <>
      <PageHeader
        title="Teach what you practise"
        description="Publish focused, practical courses for learners in India and worldwide. You keep ownership of your expertise; we handle the platform, payments and support."
      >
        <Button asChild size="lg">
          <Link href="/register?intent=instructor">Create an account to apply</Link>
        </Button>
      </PageHeader>
      <Container className="py-14 sm:py-20">
        <SectionHeading title="From application to first sale" />
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-5">
              <span className="font-display text-3xl text-primary">{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-text">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-14 max-w-2xl text-muted">
          Revenue shares are agreed per instructor and recorded with every sale, so later changes never alter past
          earnings. Payouts are reviewed and processed manually in the first release.
        </p>
      </Container>
    </>
  );
}
