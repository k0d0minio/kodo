import * as React from "react";
import { Textarea } from "./textarea.js";
import { cn } from "../lib/utils.js";

export interface TextareaMessageProps extends React.ComponentProps<typeof Textarea> {
  errorMessage?: string;
}

export const TextareaMessage = React.forwardRef<HTMLTextAreaElement, TextareaMessageProps>(
  ({ className, errorMessage, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn(className)}
        aria-invalid={!!errorMessage}
        aria-errormessage={errorMessage ? `${props.id || "message"}-error` : undefined}
        {...props}
      />
    );
  },
);
TextareaMessage.displayName = "TextareaMessage";

