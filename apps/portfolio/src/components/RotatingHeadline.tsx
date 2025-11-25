"use client";

import { Heading, Text } from "@once-ui-system/core";
import { RevealFx } from "@once-ui-system/core";
import { useState, useEffect } from "react";

interface RotatingHeadlineProps {
  headlines: React.ReactNode[];
  sublines: React.ReactNode[];
}

export function RotatingHeadline({ headlines, sublines }: RotatingHeadlineProps) {
  const [headlineIndex, setHeadlineIndex] = useState<number>(0);
  const [sublineIndex, setSublineIndex] = useState<number>(0);

  useEffect(() => {
    // Randomly select indices on mount
    const headlineIdx = Math.floor(Math.random() * headlines.length);
    const sublineIdx = Math.floor(Math.random() * sublines.length);
    setHeadlineIndex(headlineIdx);
    setSublineIndex(sublineIdx);
  }, [headlines.length, sublines.length]);

  const currentHeadline = Array.isArray(headlines) ? headlines[headlineIndex] : headlines;
  const currentSubline = Array.isArray(sublines) ? sublines[sublineIndex] : sublines;

  return (
    <>
      <RevealFx translateY="4" fillWidth horizontal="center" paddingBottom="16">
        <Heading wrap="balance" variant="display-strong-l">
          {currentHeadline}
        </Heading>
      </RevealFx>
      <RevealFx translateY="8" delay={0.2} fillWidth horizontal="center" paddingBottom="32">
        <Text wrap="balance" onBackground="neutral-weak" variant="heading-default-xl">
          {currentSubline}
        </Text>
      </RevealFx>
    </>
  );
}

