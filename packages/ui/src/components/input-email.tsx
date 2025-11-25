import * as React from "react";
import { Input } from "./input.js";
import { cn } from "../lib/utils.js";

export interface InputEmailProps extends React.ComponentProps<typeof Input> {
  errorMessage?: string;
}

export const InputEmail = React.forwardRef<HTMLInputElement, InputEmailProps>(
  ({ className, errorMessage, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="email"
        className={cn(className)}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${props.id || "email"}-error` : undefined}
        {...props}
      />
    );
  },
);
InputEmail.displayName = "InputEmail";

