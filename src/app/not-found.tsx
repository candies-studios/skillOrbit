import Link from "next/link";
import { Compass } from "lucide-react";
import { Container, Logo } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";

export default function NotFound() {
  return (
    <main id="main" className="min-h-dvh">
      <Container className="py-8">
        <Logo />
      </Container>
      <Container className="max-w-2xl py-16">
        <EmptyState
          icon={Compass}
          title="We couldn’t find that page"
          description="The link may be out of date, or the page may have moved. Try the course catalogue instead."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/courses">Browse courses</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/">Go to homepage</Link>
              </Button>
            </div>
          }
        />
      </Container>
    </main>
  );
}
