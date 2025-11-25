import * as React from "react";
import { Input } from "./input.js";
import { cn } from "../lib/utils.js";

export interface InputPhoneProps extends React.ComponentProps<typeof Input> {
  errorMessage?: string;
}

export const InputPhone = React.forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ className, errorMessage, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="tel"
        className={cn(className)}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${props.id || "phone"}-error` : undefined}
        {...props}
      />
    );
  },
);
InputPhone.displayName = "InputPhone";

