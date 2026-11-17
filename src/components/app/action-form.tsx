"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/lib/actions";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

const FieldErrorsContext = React.createContext<Record<string, string>>({});
const PendingContext = React.createContext(false);
export const useFieldErrors = () => React.useContext(FieldErrorsContext);

/**
 * Form bound to a server action. Submits via onSubmit (React 19 clears
 * forms that use the `action` prop, which would wipe input on errors),
 * shows errors inline and success as a toast.
 */
export function ActionForm({
  action,
  children,
  className,
  successToast = true,
  resetOnSuccess = false,
  confirm,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  successToast?: boolean;
  resetOnSuccess?: boolean;
  /** Ask before running a destructive action. */
  confirm?: string;
}) {
  const [state, formAction, pending] = React.useActionState<ActionResult | null, FormData>(action, null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastHandled = React.useRef<ActionResult | null>(null);

  React.useEffect(() => {
    if (state && state !== lastHandled.current && state.ok) {
      lastHandled.current = state;
      if (successToast) toast.success(state.message ?? "Saved");
      if (resetOnSuccess) formRef.current?.reset();
    }
  }, [state, successToast, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        React.startTransition(() => formAction(fd));
      }}
    >
      {state && !state.ok && (
        <Notice tone="warning" className="mb-4">
          {state.error}
        </Notice>
      )}
      <PendingContext.Provider value={pending}>
        <FieldErrorsContext.Provider value={state && !state.ok ? (state.fieldErrors ?? {}) : {}}>
          {children}
        </FieldErrorsContext.Provider>
      </PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({ children, ...props }: ButtonProps) {
  const pending = React.useContext(PendingContext);
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  );
}
