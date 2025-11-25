import * as React from "react";
import { Input } from "./input.js";
import { cn } from "../lib/utils.js";

export interface InputNameProps extends React.ComponentProps<typeof Input> {
  errorMessage?: string;
}

export const InputName = React.forwardRef<HTMLInputElement, InputNameProps>(
  ({ className, errorMessage, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="text"
        className={cn(className)}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${props.id || "name"}-error` : undefined}
        {...props}
      />
    );
  },
);
InputName.displayName = "InputName";

