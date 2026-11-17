import type { Metadata } from "next";
import { PageTitle, Panel } from "@/components/app/page-title";
import { ActionForm, SubmitButton } from "@/components/app/action-form";
import { TextField } from "@/components/app/fields";
import { Badge } from "@/components/ui/feedback";
import { Checkbox } from "@/components/ui/form-controls";
import { requireAdmin } from "@/lib/auth/viewer";
import { listAllCategories } from "@/lib/courses/manage";
import { saveCategory } from "../actions";

export const metadata: Metadata = { title: "Admin · Categories", robots: { index: false } };

type Cat = Awaited<ReturnType<typeof listAllCategories>>[number];

function CategoryFields({ c, prefix }: { c?: Cat; prefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_6rem_6rem]">
      <TextField id={`${prefix}-name`} name="name" label="Name" required defaultValue={c?.name ?? ""} />
      <TextField
        id={`${prefix}-short`}
        name="short_name"
        label="Short name"
        required
        defaultValue={c?.shortName ?? ""}
      />
      <TextField id={`${prefix}-slug`} name="slug" label="Web address" required defaultValue={c?.slug ?? ""} />
      <TextField
        id={`${prefix}-hue`}
        name="hue"
        label="Hue"
        type="number"
        min={0}
        max={359}
        defaultValue={c?.hue ?? 240}
      />
      <TextField
        id={`${prefix}-order`}
        name="sort_order"
        label="Order"
        type="number"
        min={0}
        defaultValue={c?.sortOrder ?? 0}
      />
      <div className="sm:col-span-2 lg:col-span-5">
        <TextField
          id={`${prefix}-desc`}
          name="description"
          label="Description"
          defaultValue={c?.description ?? ""}
          maxLength={400}
        />
      </div>
    </div>
  );
}

export default async function AdminCategories() {
  await requireAdmin();
  const categories = await listAllCategories();
  return (
    <>
      <PageTitle
        title="Categories"
        description="Changing a web address breaks old links to that category, so do it rarely."
      />
      <div className="space-y-4">
        {categories.map((c) => (
          <Panel key={c.id}>
            <ActionForm action={saveCategory.bind(null, c.id)} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="size-4 rounded-full" style={{ background: `hsl(${c.hue} 50% 40%)` }} aria-hidden />
                <h2 className="font-semibold">{c.name}</h2>
                {!c.isActive && <Badge>Hidden</Badge>}
              </div>
              <CategoryFields c={c} prefix={c.id} />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox name="is_active" defaultChecked={c.isActive} /> Visible on the site
                </label>
                <SubmitButton size="sm">Save</SubmitButton>
              </div>
            </ActionForm>
          </Panel>
        ))}
        <Panel title="New category">
          <ActionForm action={saveCategory.bind(null, null)} className="space-y-4" resetOnSuccess>
            <CategoryFields prefix="new" />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="is_active" defaultChecked /> Visible on the site
              </label>
              <SubmitButton size="sm">Create category</SubmitButton>
            </div>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
