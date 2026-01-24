import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function Field({
  className,
  ...props
}: React.ComponentProps<"div"> & { "data-invalid"?: boolean }) {
  return (
    <div data-slot="field" className={cn("grid gap-2", className)} {...props} />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("[[data-invalid=true]_&]:text-destructive", className)}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  errors,
  ...props
}: React.ComponentProps<"p"> & { errors?: unknown[] }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  // TanStack Form with Zod returns errors as an array of objects with message property
  const errorMessages = errors.map((error) => {
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return String(error);
  });

  return (
    <p
      data-slot="field-error"
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {errorMessages.join(", ")}
    </p>
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

export { Field, FieldLabel, FieldDescription, FieldError, FieldGroup };
