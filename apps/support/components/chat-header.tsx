"use client";

import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { type LinearProject, LinearProjectSelector } from "./linear-project-selector";
import { ProjectInfo, type ProjectMetadata } from "./project-info";

function PureChatHeader({
  chatId,
  selectedProject,
  onProjectChange,
  isReadonly,
  lockedProject,
  customerRoute,
  projectMetadata,
}: {
  chatId: string;
  selectedProject: LinearProject | null;
  onProjectChange: (project: LinearProject | null) => void;
  isReadonly: boolean;
  lockedProject?: boolean;
  customerRoute?: string;
  projectMetadata?: ProjectMetadata | null;
}) {
  const router = useRouter();

  const handleNewChat = () => {
    if (customerRoute) {
      router.push(`/c/${customerRoute}`);
      router.refresh();
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 py-2 md:px-3 md:py-2.5 border-b">
      <Button
        className="order-2 ml-auto h-9 min-w-[36px] px-2.5 md:order-1 md:ml-0 md:h-10 md:px-3"
        onClick={handleNewChat}
        variant="outline"
        size="sm"
      >
        <PlusIcon />
        <span className="sr-only md:not-sr-only md:ml-2">New</span>
      </Button>

      {!isReadonly && !lockedProject && (
        <LinearProjectSelector
          chatId={chatId}
          className="order-1 md:order-2"
          selectedProject={selectedProject}
          onProjectChange={onProjectChange}
        />
      )}

      {projectMetadata && (
        <div className="order-3">
          <ProjectInfo metadata={projectMetadata} />
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedProject?.id === nextProps.selectedProject?.id &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.lockedProject === nextProps.lockedProject &&
    prevProps.customerRoute === nextProps.customerRoute &&
    prevProps.projectMetadata?.name === nextProps.projectMetadata?.name
  );
});
