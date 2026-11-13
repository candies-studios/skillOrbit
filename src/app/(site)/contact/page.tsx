import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/layout/primitives";
import { brand } from "@/config/brand";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact", description: `Get in touch with the ${brand.name} team.` };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact us"
        description="Questions about a course, a payment or teaching with us? Send a message and we’ll reply by email."
      />
      <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <ContactForm supportEmail={brand.supportEmail} />
        </div>
        <aside className="space-y-8 text-[15px]">
          <div>
            <h2 className="font-semibold text-text">Before you write</h2>
            <p className="mt-2 text-muted">
              Many answers are in the{" "}
              <Link href="/faq" className="text-primary underline underline-offset-4">
                FAQ
              </Link>{" "}
              and the{" "}
              <Link href="/legal/refunds" className="text-primary underline underline-offset-4">
                refund policy
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-text">Email</h2>
            <p className="mt-2 text-muted">
              {brand.supportEmail ? (
                <a href={`mailto:${brand.supportEmail}`} className="text-primary underline underline-offset-4">
                  {brand.supportEmail}
                </a>
              ) : (
                "Support email not configured yet."
              )}
            </p>
          </div>
          {brand.postalAddress && (
            <div>
              <h2 className="font-semibold text-text">Address</h2>
              <p className="mt-2 whitespace-pre-line text-muted">{brand.postalAddress}</p>
            </div>
          )}
        </aside>
      </Container>
    </>
  );
}
