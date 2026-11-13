import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "About", description: `Why ${brand.name} exists and how we build courses.` };

const PRINCIPLES = [
  {
    title: "Useful over impressive",
    body: "A course earns its place if a learner can do something new at the end of it. We cut anything that doesn't serve that.",
  },
  {
    title: "Honest about outcomes",
    body: "We never promise income or jobs. We describe what a course teaches and let the curriculum speak for itself.",
  },
  {
    title: "Fair to instructors",
    body: "Instructors agree their revenue share up front, and every sale is recorded in a ledger they can see.",
  },
  {
    title: "Priced for where you are",
    body: "Courses are priced in rupees for learners in India, with international payment options planned.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Practical skills, taught plainly"
        description={`${brand.name} is an online school for the digital skills that help people find work, serve clients and run small businesses.`}
      />
      <Container className="grid gap-14 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div className="prose-doc">
          <p>
            The internet is full of free tutorials and expensive promises. What’s harder to find is a short, well-built
            course that takes you from “I’ve heard of this” to “I can do this for a client” — taught by someone who does
            the work.
          </p>
          <p>
            That’s what we’re building: focused courses in AI, digital marketing, freelancing, e-commerce, content
            creation and business finance. Each one is reviewed before it’s published, previewable before you pay, and
            designed around a practical outcome.
          </p>
          <p>
            We’re starting in India and building for learners everywhere. Courses are written in clear English with
            examples that work in Indian and international markets.
          </p>
        </div>
        <ul className="space-y-8">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="border-l-2 border-primary pl-5">
              <h2 className="text-lg font-semibold text-text">{p.title}</h2>
              <p className="mt-1.5 leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>
      <Container className="pb-20">
        <div className="flex flex-col items-start gap-6 rounded-xl bg-ink p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <p className="font-display text-2xl sm:text-3xl">Have a skill worth teaching?</p>
          <Button asChild variant="inverse" size="lg">
            <Link href="/teach">Teach with us</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
