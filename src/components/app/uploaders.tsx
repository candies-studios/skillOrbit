"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { ActionResult } from "@/lib/actions";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_RESOURCE = 50 * 1024 * 1024;

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base =
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "file";
  const ext =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 8)
      : "";
  return ext ? `${base}.${ext}` : base;
}

/**
 * Uploads straight from the browser to Supabase Storage. Storage policies
 * only accept paths inside a course the user manages; the server action then
 * re-checks the path before saving it.
 */
export function CoverUploader({
  courseId,
  onUploaded,
  disabled,
}: {
  courseId: string;
  onUploaded: (path: string) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) return toast.error("Use a JPG, PNG or WebP image.");
    if (file.size > MAX_IMAGE) return toast.error("Images must be 5 MB or smaller.");
    const supabase = getBrowserSupabase();
    if (!supabase) return toast.error("Storage isn’t connected.");
    setPending(true);
    const path = `${courseId}/cover-${Date.now()}.${file.type.split("/")[1]}`;
    const { error } = await supabase.storage.from("course-images").upload(path, file, { contentType: file.type });
    if (error) {
      setPending(false);
      return toast.error("Upload failed. Try again.");
    }
    const res = await onUploaded(path);
    setPending(false);
    if (!res.ok) toast.error(res.error);
    else toast.success(res.message ?? "Uploaded");
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        id={`cover-${courseId}`}
        disabled={disabled || pending}
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <Upload /> Upload cover image
      </Button>
      <p className="mt-2 text-xs text-subtle">JPG, PNG or WebP, up to 5 MB. 1600 × 1000 px works well.</p>
    </>
  );
}

export function ResourceUploader({
  courseId,
  lessonId,
  onUploaded,
  disabled,
}: {
  courseId: string;
  lessonId: string;
  onUploaded: (input: { title: string; path: string; size: number; mime: string }) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    if (file.size > MAX_RESOURCE) return toast.error("Files must be 50 MB or smaller.");
    const supabase = getBrowserSupabase();
    if (!supabase) return toast.error("Storage isn’t connected.");
    setPending(true);
    const path = `${courseId}/${lessonId}/${Date.now()}-${safeName(file.name)}`;
    const { error } = await supabase.storage
      .from("lesson-resources")
      .upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (error) {
      setPending(false);
      return toast.error("Upload failed. Try again.");
    }
    const res = await onUploaded({ title: file.name.slice(0, 160), path, size: file.size, mime: file.type });
    setPending(false);
    if (!res.ok) toast.error(res.error);
    else toast.success(res.message ?? "Uploaded");
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        className="sr-only"
        id={`res-${lessonId}`}
        disabled={disabled || pending}
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={pending}
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        <Upload /> Add file
      </Button>
    </>
  );
}
