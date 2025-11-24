import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { ticketService } from "@/lib/services/ticket.service";
import {
  getLinearIssuesByProject,
  getLinearProjectMetadata,
  searchLinearIssues as searchLinearIssuesFunction,
} from "./client";

// Tool schemas
const ListLinearIssuesSchema = z.object({
  projectId: z.string(),
  limit: z.number().optional(),
  statusFilter: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
});

const GetLinearProjectInfoSchema = z.object({
  projectId: z.string(),
});

const SearchLinearIssuesSchema = z.object({
  projectId: z.string(),
  query: z.string(),
});

const CreateLinearTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.number().min(0).max(4),
  projectId: z.string(),
});

// Tool definitions
const listLinearIssuesTool = tool(
  "list_linear_issues",
  "List existing tickets/issues from a Linear project. Use this to check for duplicate issues before creating new tickets.",
  ListLinearIssuesSchema.shape,
  async (args) => {
    try {
      const issues = await getLinearIssuesByProject(args.projectId, {
        limit: args.limit,
        statusFilter: args.statusFilter,
      });

      // Return customer-friendly message without technical details
      const message = `There are ${issues.length} open ticket${issues.length === 1 ? "" : "s"} in this project.`;

      return {
        content: [
          {
            type: "text",
            text: message,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              message: "Failed to fetch Linear issues",
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

const getLinearProjectInfoTool = tool(
  "get_linear_project_info",
  "Get metadata about a Linear project including name, description, and timeline information.",
  GetLinearProjectInfoSchema.shape,
  async (args) => {
    try {
      const metadata = await getLinearProjectMetadata(args.projectId);

      return {
        content: [
          {
            type: "text",
            text: `Working with project: ${metadata.name}`,
          },
        ],
        isError: false,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              message: "Failed to fetch project metadata",
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

const searchLinearIssuesTool = tool(
  "search_linear_issues",
  "Search for existing tickets in a Linear project by query string. Use this to find potential duplicates. Returns structured data with full issue details including title, description, state, identifier, and relevance information.",
  SearchLinearIssuesSchema.shape,
  async (args) => {
    try {
      const issues = await searchLinearIssuesFunction(args.projectId, args.query, {
        maxResults: 10,
        retryOnError: true,
      });

      // Return structured JSON with full issue details for AI processing
      // The AI will use this to intelligently compare and present results
      const result = {
        success: true,
        foundIssues: issues.length > 0,
        issueCount: issues.length,
        issues: issues.map((issue) => ({
          title: issue.title,
          identifier: issue.identifier,
          state: issue.state,
          description: issue.description ? issue.description.substring(0, 200) : null, // Truncate for brevity
          matchType: issue.matchType,
          relevanceScore: issue.relevanceScore,
          priority: issue.priority,
        })),
        // Customer-friendly message for presentation
        customerMessage:
          issues.length > 0
            ? `I found ${issues.length} similar request${issues.length === 1 ? "" : "s"} in our system.`
            : `I didn't find any similar requests.`,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Search Linear issues error:", error);

      // Return structured error response
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              foundIssues: false,
              issueCount: 0,
              issues: [],
              error: error instanceof Error ? error.message : "Unknown error",
              message:
                "I'm having trouble searching right now. Let me try creating a new ticket for you, or you can try again in a moment.",
              customerMessage:
                "I'm experiencing some connectivity issues with the search. Let me gather a bit more information so I can create a comprehensive ticket for you.",
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

const createLinearTicketTool = tool(
  "create_linear_ticket",
  "Create a new support ticket in Linear. Use this after gathering sufficient information from the customer.",
  CreateLinearTicketSchema.shape,
  async (args) => {
    try {
      // Use ticket service - note: MCP server doesn't have access to conversation messages
      // so we pass an empty array. The agent route's inline tool should be used instead
      // which has access to conversation messages.
      const result = await ticketService.createTicket(
        args.title,
        args.description,
        args.priority,
        args.projectId,
        [], // Empty conversation array since MCP server doesn't have access to messages
      );

      return {
        content: [
          {
            type: "text",
            text: result.message,
          },
        ],
        isError: false,
      };
    } catch (error) {
      console.error("Failed to create Linear ticket:", error);

      // Return error response instead of mock ticket
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Failed to create ticket",
              message:
                "Sorry, we encountered an error while creating your ticket. Please try again or contact support directly.",
            }),
          },
        ],
        isError: true,
      };
    }
  },
);

// Create the MCP server
export const linearMcpServer = createSdkMcpServer({
  name: "linear-ticketing",
  version: "1.0.0",
  tools: [
    listLinearIssuesTool,
    getLinearProjectInfoTool,
    searchLinearIssuesTool,
    createLinearTicketTool,
  ],
});
