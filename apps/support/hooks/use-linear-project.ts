"use client";

import { useState } from "react";
import type { LinearProject } from "@/components/linear-project-selector";

export function useLinearProject({
  chatId,
  initialProject,
  locked,
}: {
  chatId: string;
  initialProject: LinearProject | null;
  locked?: boolean;
}) {
  const [selectedProject, setSelectedProject] = useState<LinearProject | null>(initialProject);

  const updateProject = (project: LinearProject | null) => {
    if (locked) {
      return; // Prevent project changes when locked
    }
    setSelectedProject(project);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem(`linear-project-${chatId}`, JSON.stringify(project));
    }
  };

  return {
    selectedProject,
    updateProject,
  };
}
