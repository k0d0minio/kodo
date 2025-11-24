"use client";

import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "./icons";

export type LinearProject = {
  id: string;
  name: string;
  key: string;
};

function PureLinearProjectSelector({
  chatId,
  selectedProject,
  onProjectChange,
  className,
}: {
  chatId: string;
  selectedProject: LinearProject | null;
  onProjectChange: (project: LinearProject | null) => void;
  className?: string;
}) {
  const [projects, setProjects] = useState<LinearProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/linear/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        } else {
          console.error("Failed to fetch Linear projects:", response.status, response.statusText);
          // Set a default project option when API fails
          setProjects([{ id: "default", name: "Default Project", key: "DEF" }]);
        }
      } catch (error) {
        console.error("Failed to fetch Linear projects:", error);
        // Set a default project option when API fails
        setProjects([{ id: "default", name: "Default Project", key: "DEF" }]);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <Button
        className={cn("h-9 min-h-[36px] text-xs sm:text-sm sm:h-10", className)}
        disabled
        variant="outline"
      >
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn("h-9 min-h-[36px] text-xs sm:text-sm sm:h-10", className)}
          variant="outline"
        >
          <span className="truncate max-w-[120px] sm:max-w-none">
            {selectedProject
              ? `${selectedProject.key} - ${selectedProject.name}`
              : "Select Project"}
          </span>
          <ChevronDownIcon size={14} className="shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-[calc(100vw-2rem)] sm:max-w-none">
        <DropdownMenuItem onClick={() => onProjectChange(null)} className="min-h-[44px]">
          No Project
        </DropdownMenuItem>
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onProjectChange(project)}
            className="min-h-[44px]"
          >
            <span className="truncate">
              {project.key} - {project.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const LinearProjectSelector = memo(PureLinearProjectSelector, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedProject?.id === nextProps.selectedProject?.id &&
    prevProps.className === nextProps.className
  );
});
