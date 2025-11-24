import "server-only";

import { createLinearComment, getLinearClient, getLinearTeamId } from "@/lib/linear/client";
import type { ChatMessage } from "@/lib/types";

export class TicketService {
  /**
   * Extracts error details from Linear SDK response or error object
   */
  private extractErrorDetails(
    error: unknown,
    context?: Record<string, unknown>,
  ): {
    message: string;
    isRetryable: boolean;
    details: string;
  } {
    const errorObj = error as {
      message?: string;
      errors?: Array<{ message?: string; extensions?: { code?: string } }>;
      response?: { status?: number; statusText?: string };
      code?: string;
    };

    let errorMessage = "Unknown error";
    let isRetryable = false;
    let details = "";

    // Check for Linear SDK error structure
    if (errorObj.errors && Array.isArray(errorObj.errors) && errorObj.errors.length > 0) {
      const firstError = errorObj.errors[0];
      errorMessage = firstError.message || "Linear API error";
      const errorCode = firstError.extensions?.code;

      // Determine if error is retryable based on error code
      if (errorCode === "RATE_LIMITED" || errorCode === "INTERNAL_SERVER_ERROR") {
        isRetryable = true;
        errorMessage = "Linear API rate limit exceeded. Please try again in a moment.";
      } else if (errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") {
        errorMessage = "Invalid Linear API key or missing LINEAR_API_KEY environment variable";
      } else if (errorCode === "BAD_USER_INPUT") {
        errorMessage = `Linear API validation error: ${firstError.message || "Invalid input"}`;
      }

      details = JSON.stringify(errorObj.errors);
    } else if (errorObj.message) {
      errorMessage = errorObj.message;

      // Check for network/connectivity errors
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("ENOTFOUND")
      ) {
        isRetryable = true;
        errorMessage = `Network error connecting to Linear API: ${errorMessage}`;
      }

      // Check for rate limiting
      if (errorObj.response?.status === 429 || errorMessage.includes("rate limit")) {
        isRetryable = true;
        errorMessage = "Linear API rate limit exceeded. Please try again in a moment.";
      }

      // Check for authentication errors
      if (errorObj.response?.status === 401 || errorMessage.includes("UNAUTHENTICATED")) {
        errorMessage = "Invalid Linear API key or missing LINEAR_API_KEY environment variable";
      }

      details = errorMessage;
    } else if (errorObj instanceof Error) {
      errorMessage = errorObj.message;
      details = errorObj.stack || errorMessage;
    } else {
      details = JSON.stringify(error);
    }

    // Add context to details if provided
    if (context) {
      details += ` | Context: ${JSON.stringify(context)}`;
    }

    return { message: errorMessage, isRetryable, details };
  }

  /**
   * Creates a ticket in Linear and appends the conversation history to it.
   *
   * @param title - The ticket title
   * @param description - The ticket description
   * @param priority - Priority level (0-4)
   * @param projectId - Linear project ID
   * @param conversationMessages - Array of chat messages to append to the ticket
   * @returns Ticket creation result with Linear issue ID and URL
   * @throws Error if ticket creation fails
   */
  async createTicket(
    title: string,
    description: string,
    priority: number,
    projectId: string,
    conversationMessages: ChatMessage[],
  ): Promise<{
    success: true;
    linearIssueId: string;
    linearIssueUrl: string;
    message: string;
  }> {
    // Validate inputs
    if (!title || title.trim().length === 0) {
      throw new Error("Ticket title is required");
    }
    if (!description || description.trim().length === 0) {
      throw new Error("Ticket description is required");
    }
    if (priority < 0 || priority > 4) {
      throw new Error("Priority must be between 0 and 4");
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error(`Invalid project ID: ${projectId}`);
    }

    let linearClient: ReturnType<typeof getLinearClient>;
    let teamId: string;

    try {
      linearClient = getLinearClient();
    } catch (error) {
      const errorDetails = this.extractErrorDetails(error, { operation: "getLinearClient" });
      console.error("Failed to get Linear client:", errorDetails.details);
      throw new Error(errorDetails.message);
    }

    try {
      teamId = await getLinearTeamId();
    } catch (error) {
      const errorDetails = this.extractErrorDetails(error, { operation: "getLinearTeamId" });
      console.error("Failed to get Linear team ID:", errorDetails.details);
      throw new Error(errorDetails.message);
    }

    // Create the issue in Linear with retry logic for transient failures
    const createIssueFunction = async (): Promise<
      Awaited<ReturnType<typeof linearClient.createIssue>>["issue"]
    > => {
      const issueResult = await linearClient.createIssue({
        teamId,
        title,
        description,
        priority,
        projectId,
        labelIds: [], // Skip labels for simplicity
      });

      // Check for errors in the result
      if (!issueResult.success) {
        // Extract error details from Linear SDK response
        const errorDetails = this.extractErrorDetails(issueResult, {
          teamId,
          projectId,
          title: title.substring(0, 50),
        });

        // Log detailed error information
        console.error("Linear createIssue failed:", {
          success: issueResult.success,
          errors: (issueResult as { errors?: unknown }).errors,
          errorDetails: errorDetails.details,
          context: { teamId, projectId, priority },
        });

        // Create error with retryable flag
        const error = new Error(errorDetails.message) as Error & { isRetryable?: boolean };
        error.isRetryable = errorDetails.isRetryable;
        throw error;
      }

      if (!issueResult.issue) {
        const errorDetails = this.extractErrorDetails(
          { message: "Issue result is missing the issue object" },
          { teamId, projectId },
        );
        console.error("Linear createIssue returned no issue:", errorDetails.details);
        const error = new Error(
          "Failed to create Linear issue: No issue object returned",
        ) as Error & { isRetryable?: boolean };
        error.isRetryable = false; // Not retryable - likely a configuration issue
        throw error;
      }

      return issueResult.issue;
    };

    // Use retry logic for transient failures only
    let issue;
    let lastError: Error | unknown;
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        issue = await createIssueFunction();
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        const errorDetails = this.extractErrorDetails(error, {
          teamId,
          projectId,
          title: title.substring(0, 50),
          attempt: attempt + 1,
        });

        // Log error for debugging
        console.error(`Error creating Linear issue (attempt ${attempt + 1}/${maxRetries}):`, {
          error,
          errorDetails: errorDetails.details,
          context: { teamId, projectId, priority, title: title.substring(0, 50) },
        });

        // Check if error is retryable and we have retries left
        const isRetryable =
          (error as { isRetryable?: boolean }).isRetryable ?? errorDetails.isRetryable;

        if (!isRetryable || attempt === maxRetries - 1) {
          // Not retryable or out of retries - throw with enhanced error message
          console.error(
            "Failed to create Linear issue (not retryable or retries exhausted):",
            errorDetails.details,
          );
          throw new Error(errorDetails.message);
        }

        // Wait before retrying (exponential backoff)
        const delay = baseDelay * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we get here without an issue, throw the last error
    if (!issue) {
      const errorDetails = this.extractErrorDetails(lastError, {
        teamId,
        projectId,
        title: title.substring(0, 50),
        retriesExhausted: true,
      });
      console.error("Failed to create Linear issue after retries:", errorDetails.details);
      throw new Error(errorDetails.message);
    }

    const linearIssueId = issue.id;
    const linearIssueUrl = `https://linear.app/issue/${linearIssueId}`;

    // Generate generic ticket reference for customer
    const genericTicketId = `TICKET-${Date.now().toString().slice(-6)}`;

    // Append conversation history to the ticket
    try {
      const conversationText = this.formatConversationHistory(conversationMessages);
      await createLinearComment(linearIssueId, conversationText);
    } catch (error) {
      // Log error but don't fail the ticket creation if comment fails
      const errorDetails = this.extractErrorDetails(error, { linearIssueId });
      console.error("Failed to append conversation to Linear ticket:", errorDetails.details);
    }

    return {
      success: true,
      linearIssueId,
      linearIssueUrl,
      message: `Support ticket created successfully! Reference: ${genericTicketId}. Thank you for contacting support. Our team will review your issue and get back to you soon.`,
    };
  }

  /**
   * Formats conversation messages into a readable text format with structured summary.
   *
   * @param messages - Array of chat messages
   * @returns Formatted conversation text with summary
   */
  formatConversationHistory(messages: ChatMessage[]): string {
    const filteredMessages = messages.filter(
      (msg) => msg.role === "user" || msg.role === "assistant",
    );

    if (filteredMessages.length === 0) {
      return "No conversation history available.";
    }

    // Extract customer's original request (first user message)
    const firstUserMessage = filteredMessages.find((msg) => msg.role === "user");
    const originalRequest =
      firstUserMessage?.parts
        ?.map((part) => {
          if (part.type === "text") {
            return part.text;
          }
          return "";
        })
        .join("")
        .trim() || "Not specified";

    // Extract all user messages to understand what information was provided
    const userMessages = filteredMessages
      .filter((msg) => msg.role === "user")
      .map((msg) => {
        return (
          msg.parts
            ?.map((part) => {
              if (part.type === "text") {
                return part.text;
              }
              return "";
            })
            .join("")
            .trim() || ""
        );
      })
      .filter((text) => text.length > 0);

    // Extract all assistant messages to see what was asked
    const assistantMessages = filteredMessages
      .filter((msg) => msg.role === "assistant")
      .map((msg) => {
        return (
          msg.parts
            ?.map((part) => {
              if (part.type === "text") {
                return part.text;
              }
              return "";
            })
            .join("")
            .trim() || ""
        );
      })
      .filter((text) => text.length > 0);

    // Format full conversation with timestamps if available
    const formattedMessages = filteredMessages
      .map((msg, _index) => {
        const role = msg.role === "user" ? "**Customer**" : "**Support Agent**";
        const content =
          msg.parts
            ?.map((part) => {
              if (part.type === "text") {
                return part.text;
              }
              return "";
            })
            .join("")
            .trim() || "";

        // Add timestamp if available
        const timestamp = msg.metadata?.createdAt
          ? new Date(msg.metadata.createdAt).toLocaleString()
          : null;

        const timestampStr = timestamp ? ` (${timestamp})` : "";

        return `${role}${timestampStr}:\n${content}`;
      })
      .filter((line) => line.length > 0);

    // Build structured summary
    const summary = `## 📋 Conversation Summary

**Original Customer Request:**
> ${originalRequest}

**Additional Information Provided:**
${
  userMessages.length > 1
    ? userMessages
        .slice(1)
        .map((msg) => `- ${msg}`)
        .join("\n")
    : "- Customer provided initial request only"
}

**Conversation Details:**
- Total messages: ${filteredMessages.length} (${userMessages.length} from customer, ${assistantMessages.length} from agent)
- Ticket created from support chat conversation`;

    return `${summary}\n\n---\n\n## 💬 Full Conversation History\n\n${formattedMessages.join("\n\n---\n\n")}`;
  }

  /**
   * Appends conversation history to an existing Linear ticket.
   *
   * @param linearIssueId - The Linear issue ID
   * @param conversationMessages - Array of chat messages to append
   */
  async appendConversationToTicket(
    linearIssueId: string,
    conversationMessages: ChatMessage[],
  ): Promise<void> {
    const conversationText = this.formatConversationHistory(conversationMessages);
    await createLinearComment(linearIssueId, conversationText);
  }
}

// Export a singleton instance
export const ticketService = new TicketService();
