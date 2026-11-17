"use client";

import * as React from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useFieldErrors } from "./action-form";

type Common = { name: string; label: string; hint?: string; required?: boolean; id?: string };

/** Text input wired to the surrounding ActionForm's field errors. */
export function TextField({
  name,
  label,
  hint,
  required,
  id,
  ...props
}: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "id">) {
  const errors = useFieldErrors();
  return (
    <Field id={id ?? name} label={label} hint={hint} required={required} error={errors[name]}>
      {(a) => <Input {...a} name={name} {...props} />}
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  id,
  ...props
}: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id">) {
  const errors = useFieldErrors();
  return (
    <Field id={id ?? name} label={label} hint={hint} required={required} error={errors[name]}>
      {(a) => <Textarea {...a} name={name} {...props} />}
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  id,
  children,
  ...props
}: Common & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name" | "id">) {
  const errors = useFieldErrors();
  return (
    <Field id={id ?? name} label={label} hint={hint} required={required} error={errors[name]}>
      {(a) => (
        <Select {...a} name={name} {...props}>
          {children}
        </Select>
      )}
    </Field>
  );
}
