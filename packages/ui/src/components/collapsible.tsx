"use client";

import { type ComponentProps } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

export const Collapsible = ({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.Root>) => (
  <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
);

export const CollapsibleTrigger = ({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    data-slot="collapsible-trigger"
    {...props}
  />
);

export const CollapsibleContent = ({
  ...props
}: ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) => (
  <CollapsiblePrimitive.CollapsibleContent
    data-slot="collapsible-content"
    {...props}
  />
);
