import { tool, type UIMessageStreamWriter } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { ticketService } from "@/lib/services/ticket.service";
import type { ChatMessage } from "@/lib/types";

const CreateTicketParams = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.number().min(0).max(4),
});

type CreateLinearTicketProps = {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  selectedProject?: { id: string; name: string; key: string } | null;
  chatId?: string;
  conversationMessages?: ChatMessage[];
};

export const createLinearTicket = ({
  session,
  dataStream,
  selectedProject,
  chatId,
  conversationMessages = [],
}: CreateLinearTicketProps) =>
  tool({
    description:
      "Create a support ticket in Linear when you have gathered sufficient information about the customer's issue. This should be called after understanding the problem, gathering reproduction steps, and determining priority.",
    inputSchema: CreateTicketParams,
    execute: async ({ title, description, priority }: z.infer<typeof CreateTicketParams>) => {
      if (!selectedProject?.id) {
        throw new Error("No project selected. Please select a Linear project first.");
      }

      try {
        const result = await ticketService.createTicket(
          title,
          description,
          priority,
          selectedProject.id,
          conversationMessages,
        );

        return {
          success: true,
          linearIssueId: result.linearIssueId,
          linearIssueUrl: result.linearIssueUrl,
          message: result.message,
        };
      } catch (error) {
        console.error("Failed to create Linear ticket:", error);
        // Propagate error instead of creating mock ticket
        throw error;
      }
    },
  });
