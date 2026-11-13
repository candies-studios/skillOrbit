"use client";

import { Toaster as Sonner } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-line !bg-surface !text-text !shadow-pop !font-sans",
          description: "!text-muted",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
    />
  );
}
