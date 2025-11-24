"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import type { ProjectMetadata } from "@/components/project-info";
import type { VisibilityType } from "@/components/visibility-selector";
import { myProvider } from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  updateChatVisiblityById,
} from "@/lib/db/queries";

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

export async function generateTitleFromUserMessage({ message }: { message: UIMessage }) {
  const { text: title } = await generateText({
    model: myProvider.languageModel("title-model"),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const [message] = await getMessageById({ id });

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility });
}

export type WelcomeMessage = {
  header: string;
  subline: string;
  instruction: string;
};

export async function generateWelcomeMessage(
  projectMetadata: ProjectMetadata | null,
): Promise<WelcomeMessage> {
  if (!projectMetadata) {
    return {
      header: "Welcome to Support!",
      subline:
        "I'm your dedicated support agent. I'll help you create a comprehensive support ticket by gathering all the necessary details about your issue.",
      instruction:
        "Please select a Linear project above, then describe your issue and I'll guide you through creating a detailed support ticket.",
    };
  }

  const formatDate = (date: Date | string | null): string => {
    if (!date) return "not set";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(dateObj.getTime())) return "not set";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  const projectContext = `
Project Name: ${projectMetadata.name}
Description: ${projectMetadata.description || "No description available"}
Status: ${projectMetadata.status}
Progress: ${projectMetadata.progress}%
Total Issues: ${projectMetadata.totalIssues}
Completed Issues: ${projectMetadata.completedIssues}
In Progress Issues: ${projectMetadata.inProgressIssues}
Start Date: ${formatDate(projectMetadata.startDate)}
Target Date: ${formatDate(projectMetadata.targetDate)}
`;

  // Fallback message in case AI generation fails
  const fallbackMessage: WelcomeMessage = {
    header: `Welcome to ${projectMetadata.name} Support!`,
    subline: `I'm your dedicated support agent for ${projectMetadata.name}. I'll help you create a comprehensive support ticket by gathering all the necessary details about your issue.`,
    instruction:
      "Describe your issue below and I'll guide you through creating a detailed support ticket.",
  };

  try {
    const { text } = await generateText({
      model: myProvider.languageModel("title-model"),
      system: `You are a friendly support assistant. Generate a personalized welcome message for a support chat interface based on the project context provided.

The message should have three parts:
1. Header: A welcoming header that mentions the project name (keep it concise, max 60 characters)
2. Subline: A friendly, personalized message that references the project context (max 120 characters)
3. Instruction: A brief instruction on what the user should do next (max 100 characters)

Make the message warm, professional, and contextually relevant to the project. Reference the project's status, progress, or description naturally.

Return your response as a JSON object with exactly these keys: "header", "subline", "instruction"
Example format:
{
  "header": "Welcome to [Project Name] Support!",
  "subline": "I'm here to help with [project context]. Let's get your issue resolved quickly.",
  "instruction": "Describe your issue below and I'll help create a support ticket."
}`,
      prompt: `Generate a personalized welcome message for this project:\n${projectContext}`,
    });

    try {
      const parsed = JSON.parse(text) as WelcomeMessage;
      // Validate the structure
      if (
        typeof parsed.header === "string" &&
        typeof parsed.subline === "string" &&
        typeof parsed.instruction === "string"
      ) {
        return parsed;
      }
    } catch (parseError) {
      // If parsing fails, use fallback
      console.warn("Failed to parse AI-generated welcome message, using fallback", parseError);
    }
  } catch (error) {
    // If AI generation fails (API error, network issue, etc.), use fallback
    // Catch all error types including AI_APICallError, network errors, etc.
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : "UnknownError";

    // Log error details for debugging but don't throw - always return fallback
    console.warn(
      `Failed to generate welcome message with AI (${errorName}), using fallback:`,
      errorMessage,
    );
  }

  // Always return fallback message if AI generation or parsing fails
  // This ensures the page can still render even if AI generation fails
  return fallbackMessage;
}
