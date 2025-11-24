"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";
import type { ComponentProps } from "react";

export const AspectRatio = ({ ...props }: ComponentProps<typeof AspectRatioPrimitive.Root>) => (
  <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
);
