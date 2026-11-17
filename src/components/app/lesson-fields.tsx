"use client";

import { Checkbox } from "@/components/ui/form-controls";
import { SelectField, TextAreaField, TextField } from "./fields";
import type { ManagedLesson } from "@/lib/courses/manage";

/** Shared inputs for adding and editing a lesson. */
export function LessonFields({ lesson, idPrefix }: { lesson?: ManagedLesson; idPrefix: string }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem_8rem]">
        <TextField
          id={`${idPrefix}-title`}
          name="title"
          label="Lesson title"
          required
          defaultValue={lesson?.title ?? ""}
        />
        <SelectField id={`${idPrefix}-type`} name="type" label="Type" defaultValue={lesson?.type ?? "video"}>
          <option value="video">Video</option>
          <option value="reading">Reading</option>
          <option value="quiz">Quiz</option>
          <option value="assignment">Assignment</option>
        </SelectField>
        <TextField
          id={`${idPrefix}-duration`}
          name="duration_minutes"
          label="Minutes"
          type="number"
          min={0}
          max={1440}
          inputMode="numeric"
          defaultValue={lesson?.duration_minutes ?? 0}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <TextField
          id={`${idPrefix}-vp`}
          name="video_provider"
          label="Video provider"
          hint="e.g. bunny, vimeo"
          defaultValue={lesson?.video_provider ?? ""}
        />
        <TextField
          id={`${idPrefix}-vid`}
          name="video_asset_id"
          label="Video ID"
          hint="The provider’s private video ID. Never shown publicly."
          defaultValue={lesson?.video_asset_id ?? ""}
        />
      </div>
      <TextAreaField
        id={`${idPrefix}-body`}
        name="body"
        label="Lesson notes or reading"
        rows={4}
        hint="Shown to enrolled learners in the course player."
        defaultValue={lesson?.body ?? ""}
      />
      <label className="flex items-center gap-2 text-sm text-text">
        <Checkbox name="is_preview" defaultChecked={lesson?.is_preview ?? false} /> Free preview (anyone can watch)
      </label>
    </div>
  );
}
