"use client";

import { Container } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/feedback";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="max-w-2xl py-20">
      <ErrorState
        title="This page didn’t load"
        description={
          error.digest
            ? `Something went wrong on our side. If it keeps happening, contact support and quote reference ${error.digest}.`
            : "Something went wrong on our side. Try again in a moment."
        }
        action={<Button onClick={reset}>Try again</Button>}
      />
    </Container>
  );
}
