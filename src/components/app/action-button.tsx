"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/actions";

/** One-click server action with optional confirmation and toast feedback. */
export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: Omit<ButtonProps, "onClick"> & { action: () => Promise<ActionResult>; confirm?: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      type="button"
      loading={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          if (res?.ok === false) toast.error(res.error);
          else if (res?.message) toast.success(res.message);
        });
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
