"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Suggestion } from "./elements/suggestion";
import type { LinearProject } from "./linear-project-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: (message: string) => void;
  selectedProject: LinearProject | null;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  const suggestedActions = ["Report a bug", "Feature request", "Access issue", "General inquiry"];

  return (
    <div className="grid w-full gap-2 sm:grid-cols-2" data-testid="suggested-actions">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.replaceState({}, "", `/chat/${chatId}`);
              sendMessage(suggestion);
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) {
    return false;
  }
  if (prevProps.selectedProject?.id !== nextProps.selectedProject?.id) {
    return false;
  }

  return true;
});
