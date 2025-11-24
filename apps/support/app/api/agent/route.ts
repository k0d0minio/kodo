import { query } from "@anthropic-ai/claude-agent-sdk";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ticketingAgentPrompt } from "@/lib/ai/prompts";
import { getMessagesByChatId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { linearMcpServer } from "@/lib/linear/mcp-server";
import { ticketService } from "@/lib/services/ticket.service";
import type { ChatMessage } from "@/lib/types";

const agentRequestSchema = z.object({
  chatId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  selectedProject: z
    .object({
      id: z.string(),
      name: z.string(),
      key: z.string(),
    })
    .nullable(),
  action: z.enum(["send", "interrupt"]).default("send"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const body = await request.json();
    const { chatId, message, selectedProject, action } = agentRequestSchema.parse(body);

    if (action === "interrupt") {
      // Handle interrupt - for now just return success
      return NextResponse.json({ success: true, message: "Agent interrupted" });
    }

    if (!selectedProject) {
      return NextResponse.json(
        { error: "No project selected. Please select a Linear project first." },
        { status: 400 },
      );
    }

    // Get conversation history
    const existingMessages = await getMessagesByChatId({ id: chatId });

    // Convert DB messages to ChatMessage format for ticket service
    const convertToChatMessages = (dbMessages: typeof existingMessages): ChatMessage[] => {
      return dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        parts: msg.parts || [],
        metadata: {
          createdAt: msg.createdAt.toISOString(),
        },
      }));
    };

    // Track conversation messages for ticket creation
    let conversationMessages = convertToChatMessages(existingMessages);

    // Ticket creation function using service layer
    const createTicketWithService = async (
      title: string,
      description: string,
      priority: number,
      projectId: string,
    ) => {
      // Get updated conversation including the new user message
      const updatedMessages = await getMessagesByChatId({ id: chatId });
      conversationMessages = convertToChatMessages(updatedMessages);

      // Add the new user message if not already in the conversation
      const hasNewMessage = conversationMessages.some(
        (msg) => msg.role === "user" && msg.parts?.[0]?.text === message,
      );
      if (!hasNewMessage) {
        conversationMessages.push({
          id: `temp-${Date.now()}`,
          role: "user",
          parts: [{ type: "text", text: message }],
          metadata: { createdAt: new Date().toISOString() },
        });
      }

      try {
        const result = await ticketService.createTicket(
          title,
          description,
          priority,
          projectId,
          conversationMessages,
        );
        return result;
      } catch (error) {
        // Log detailed error information for debugging
        const errorMessage = error instanceof Error ? error.message : "Failed to create ticket";
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error("Failed to create Linear ticket in createTicketWithService:", {
          error,
          errorMessage,
          errorStack,
          context: {
            title: title?.substring(0, 50),
            projectId,
            priority,
            chatId,
          },
        });

        // Propagate error - it should already have a user-friendly message from ticketService
        throw error;
      }
    };

    // Create streaming user message with conversation history
    async function* userMessageStream() {
      // First, yield all previous messages for context
      for (const msg of existingMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          yield {
            type: msg.role === "user" ? ("user" as const) : ("assistant" as const),
            message: {
              content: msg.parts?.[0]?.text || "",
              role: msg.role as "user" | "assistant",
            },
            parent_tool_use_id: null,
            session_id: chatId,
          };
        }
      }

      // Then yield the new message
      yield {
        type: "user" as const,
        message: {
          content: message,
          role: "user" as const,
        },
        parent_tool_use_id: null,
        session_id: chatId,
      };
    }

    // Configure the agent query
    const agentQuery = query({
      prompt: userMessageStream(),
      options: {
        systemPrompt: {
          type: "preset",
          preset: "claude_code",
          append: `\n\n${ticketingAgentPrompt}\n\nSelected Project: ${selectedProject.name} (ID: ${selectedProject.id})\n\nCRITICAL INSTRUCTIONS:\n1. **Track conversation state**: Before responding, review ALL previous messages and track:\n   - What the customer originally asked for\n   - What information you've already gathered\n   - What questions you've already asked\n   - What answers you've received\n2. **Never repeat questions**: If a question was already answered, use that information - don't ask again\n3. **Gather information efficiently**: Ask 1-2 clarifying questions maximum if needed, then create the ticket\n4. **Create detailed tickets**: Include comprehensive descriptions with the customer's original request and all context\n5. **After 1-2 exchanges maximum**: Create the ticket - the full conversation will be automatically included\n6. **Always communicate actions**: Show when creating ("I'll create a ticket for this now..." or "Let me create a detailed ticket for you...")`,
        },
        mcpServers: {
          linear: linearMcpServer,
        },
        allowedTools: ["list_linear_issues", "get_linear_project_info"],
        tools: {
          create_linear_ticket: {
            description: `Create a new support ticket in Linear. Use this after gathering sufficient information from the customer. IMPORTANT: Always use the selected project ID: ${selectedProject.id} when creating tickets.`,
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Clear, descriptive title for the ticket" },
                description: {
                  type: "string",
                  description:
                    "Comprehensive description including the customer's original request and all gathered context",
                },
                priority: {
                  type: "number",
                  minimum: 0,
                  maximum: 4,
                  description:
                    "Priority level: 0=none, 1=low, 2=medium, 3=high, 4=urgent. Default to 2 if not specified.",
                },
                projectId: {
                  type: "string",
                  description: `The Linear project ID. Always use: ${selectedProject.id}`,
                },
              },
              required: ["title", "description", "priority", "projectId"],
            },
            execute: async (args: {
              title: string;
              description: string;
              priority: number;
              projectId: string;
            }) => {
              try {
                // Ensure we use the correct project ID
                const finalProjectId = args.projectId || selectedProject.id;
                const result = await createTicketWithService(
                  args.title,
                  args.description,
                  args.priority,
                  finalProjectId,
                );
                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(result),
                    },
                  ],
                };
              } catch (error) {
                // Log detailed error information for debugging
                const errorMessage =
                  error instanceof Error ? error.message : "Failed to create ticket";
                const errorStack = error instanceof Error ? error.stack : undefined;

                console.error("Failed to create Linear ticket in agent route:", {
                  error,
                  errorMessage,
                  errorStack,
                  context: {
                    title: args.title?.substring(0, 50),
                    projectId: args.projectId || selectedProject.id,
                    priority: args.priority,
                    chatId,
                  },
                });

                // Return error response with detailed information
                // The error message from ticketService should already be user-friendly
                return {
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify({
                        success: false,
                        error: errorMessage,
                        message: errorMessage.includes("rate limit")
                          ? "The system is currently experiencing high demand. Please try again in a moment."
                          : errorMessage.includes("API key") ||
                              errorMessage.includes("LINEAR_API_KEY")
                            ? "There's a configuration issue with the ticketing system. Please contact support."
                            : errorMessage.includes("Network error") ||
                                errorMessage.includes("connectivity")
                              ? "We're having trouble connecting to the ticketing system. Please try again in a moment."
                              : "Sorry, we encountered an error while creating your ticket. Please try again or contact support directly.",
                      }),
                    },
                  ],
                };
              }
            },
          },
        },
        permissionMode: "bypassPermissions",
        includePartialMessages: true,
      },
    });

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const message of agentQuery) {
            const chunk = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(new TextEncoder().encode(chunk));

            // Handle final result
            if (message.type === "result") {
              controller.close();
              break;
            }
          }
        } catch (error) {
          console.error("Agent query error:", error);
          const errorChunk = `data: ${JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorChunk));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request format", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
