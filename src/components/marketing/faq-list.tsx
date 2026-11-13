import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqGroup } from "@/content/faq";

export function FaqList({ items, idPrefix }: { items: FaqGroup["items"]; idPrefix: string }) {
  return (
    <Accordion type="single" collapsible className="rounded-lg border border-line bg-surface px-5">
      {items.map((it, i) => (
        <AccordionItem key={it.q} value={`${idPrefix}-${i}`}>
          <AccordionTrigger>{it.q}</AccordionTrigger>
          <AccordionContent className="max-w-[68ch] leading-relaxed">{it.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
