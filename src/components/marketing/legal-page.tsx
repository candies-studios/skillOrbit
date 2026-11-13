import { Container, PageHeader } from "@/components/layout/primitives";
import { Notice } from "@/components/ui/feedback";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} description={<span className="text-base">Last updated {updated}</span>} />
      <Container className="py-12 sm:py-16">
        <Notice tone="warning" title="Draft for legal review" className="mb-10 max-w-[68ch]">
          This policy is a starting draft written for the platform’s planned features. Have it reviewed by a qualified
          lawyer, and fill in the business details, before accepting payments.
        </Notice>
        <article className="prose-doc">{children}</article>
      </Container>
    </>
  );
}

/** Renders a configured value, or a visible placeholder when it's missing. */
export function Placeholder({ value, label }: { value: string; label: string }) {
  return value ? <>{value}</> : <mark className="rounded bg-marigold-soft px-1 text-marigold-ink">[{label}]</mark>;
}
