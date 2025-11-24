"use client";

import { type ComponentProps } from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

export const AspectRatio = ({
  ...props
}: ComponentProps<typeof AspectRatioPrimitive.Root>) => (
  <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
);
