import type { Metadata } from "next";
import { BookOpen, Inbox, IndianRupee, Users } from "lucide-react";
import { Container, Logo, SectionHeading } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, ErrorState, Notice, SampleBadge, Skeleton } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { StatCard, TBody, TD, TH, THead, TR, Table } from "@/components/ui/data";
import { CourseGridSkeleton } from "@/components/catalog/course-grid";
import { InteractiveDemos } from "./interactive";

export const metadata: Metadata = { title: "Design system", robots: { index: false, follow: false } };

const SWATCHES = [
  ["ink", "#0d1633"],
  ["primary", "#3a3fd1"],
  ["paper", "#f6f7fb"],
  ["muted", "#4f5872"],
  ["marigold", "#e3a13b"],
  ["success", "#0e8a6a"],
  ["danger", "#c2364a"],
] as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="mb-6 text-xl font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

/** Internal reference page (noindex). Shows every reusable component in its states. */
export default function DesignSystemPage() {
  return (
    <main id="main">
      <Container className="py-10">
        <Logo />
        <SectionHeading
          className="mt-10"
          title="Design system"
          description="Internal reference for SkillOrbit components. Values shown on this page are illustrative, not data."
        />

        <Block title="Colour tokens">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {SWATCHES.map(([name, hex]) => (
              <li key={name}>
                <div className="h-16 rounded-md border border-line" style={{ background: hex }} />
                <p className="mt-2 text-sm font-medium">{name}</p>
                <p className="text-xs text-subtle">{hex}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Typography">
          <p className="font-display text-6xl font-medium tracking-[-0.02em] text-ink">Display, Newsreader</p>
          <p className="mt-4 font-display text-3xl text-ink">Section heading, Newsreader</p>
          <p className="mt-4 text-lg font-semibold">Card title, Hanken Grotesk semibold</p>
          <p className="mt-2 max-w-[68ch] text-muted">
            Body copy, Hanken Grotesk regular at 15–17px with relaxed leading. Lines stay under 70 characters for
            comfortable reading.
          </p>
        </Block>

        <Block title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="ink">Ink</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </Block>

        <Block title="Form controls">
          <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
            <Field id="ds-a" label="Text input" hint="Helper text explains the field.">
              {(a) => <Input {...a} placeholder="Placeholder" />}
            </Field>
            <Field id="ds-b" label="With error" error="Enter a valid email address" required>
              {(a) => <Input {...a} defaultValue="not-an-email" />}
            </Field>
            <Field id="ds-c" label="Select">
              {(a) => (
                <Select {...a} defaultValue="b">
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                </Select>
              )}
            </Field>
            <Field id="ds-d" label="Disabled">
              {(a) => <Input {...a} disabled defaultValue="Read only" />}
            </Field>
            <div className="sm:col-span-2">
              <Field id="ds-e" label="Textarea">
                {(a) => <Textarea {...a} />}
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked /> Checkbox
            </label>
          </div>
        </Block>

        <Block title="Badges and notices">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge tone="primary">Primary</Badge>
            <Badge tone="marigold">Marigold</Badge>
            <Badge tone="success">Published</Badge>
            <Badge tone="danger">Rejected</Badge>
            <SampleBadge />
          </div>
          <div className="mt-6 grid max-w-3xl gap-3">
            <Notice tone="info" title="Info">
              Neutral information.
            </Notice>
            <Notice tone="success" title="Success">
              An action completed.
            </Notice>
            <Notice tone="warning" title="Warning">
              Something needs attention.
            </Notice>
            <Notice tone="unconfigured" title="Integration not configured">
              Shown when an external service has no credentials, instead of pretending it works.
            </Notice>
          </div>
        </Block>

        <Block title="Modals, confirmations and toasts">
          <InteractiveDemos />
        </Block>

        <Block title="Dashboard widgets">
          <p className="mb-4 text-sm text-subtle">
            KPIs render only values from verified queries. With no source, the tile says so.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Registered users" value={null} icon={Users} />
            <StatCard label="Published courses" value={null} icon={BookOpen} />
            <StatCard label="Gross sales" value={null} icon={IndianRupee} hint="Before refunds, fees and payouts" />
            <StatCard label="Open tickets" value={null} icon={Inbox} />
          </div>
        </Block>

        <Block title="Tables and filters">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="w-56">
              <Field id="ds-f1" label="Status">
                {(a) => (
                  <Select {...a}>
                    <option>All statuses</option>
                  </Select>
                )}
              </Field>
            </div>
            <div className="w-64">
              <Field id="ds-f2" label="Search">
                {(a) => <Input {...a} type="search" placeholder="Course title" />}
              </Field>
            </div>
            <Button variant="secondary">Export CSV</Button>
          </div>
          <Table>
            <THead>
              <tr>
                <TH>Course</TH>
                <TH>Status</TH>
                <TH className="text-right">Lessons</TH>
              </tr>
            </THead>
            <TBody>
              <TR>
                <TD>Example course title</TD>
                <TD>
                  <Badge tone="success">Published</Badge>
                </TD>
                <TD className="text-right tabular-nums">12</TD>
              </TR>
              <TR>
                <TD>Another example</TD>
                <TD>
                  <Badge tone="marigold">In review</Badge>
                </TD>
                <TD className="text-right tabular-nums">7</TD>
              </TR>
            </TBody>
          </Table>
        </Block>

        <Block title="Loading skeletons">
          <div className="mb-6 max-w-sm space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
          <CourseGridSkeleton count={3} />
        </Block>

        <Block title="Empty and error states">
          <div className="grid gap-5 md:grid-cols-2">
            <EmptyState
              icon={BookOpen}
              title="You haven’t enrolled in a course yet"
              description="Browse the catalogue to find your first course."
              action={<Button>Browse courses</Button>}
            />
            <ErrorState
              description="We couldn’t load your orders. Try again in a moment."
              action={<Button>Try again</Button>}
            />
          </div>
        </Block>
      </Container>
    </main>
  );
}
