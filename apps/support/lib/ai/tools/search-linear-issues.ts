import { tool } from "ai";
import { z } from "zod";
import { searchLinearIssues } from "@/lib/linear/client";

const SearchLinearIssuesParams = z.object({
  query: z.string().describe("Search query to find similar issues"),
});

type SearchLinearIssuesProps = {
  selectedProject?: { id: string; name: string; key: string } | null;
};

export const searchLinearIssuesTool = ({ selectedProject }: SearchLinearIssuesProps) =>
  tool({
    description: `Search for existing tickets/issues in Linear that might be similar to the customer's request. Use this FIRST before creating any new tickets to check for duplicates.

**Search Strategy Guidelines:**
- Extract key terms from the customer's request (nouns, verbs, and important concepts)
- Generate multiple search queries using:
  * The full customer request
  * Key terms extracted from the request
  * Synonyms or related terms (e.g., "audit trail" → "logging", "tracking", "history")
  * Simplified versions focusing on the core concept
- Examples of good queries:
  * Customer: "I want to track admin actions" → Try: "track admin actions", "admin tracking", "audit trail", "action log"
  * Customer: "Add export feature for reports" → Try: "export reports", "export feature", "download reports", "report export"
- The search automatically searches both titles and descriptions, and tries multiple query variations
- Results are ranked by relevance - issues matching in both title and description score higher

**When to search:**
- Immediately after understanding the customer's initial request
- Before asking clarifying questions (search might answer them)
- If the customer provides additional context, search again with the new information

**How to use results:**
- If similar issues found: Present them conversationally to the customer ("I found a similar request about [topic]. Is this what you're looking for?")
- If customer confirms it's the same: Inform them the team is already working on it
- If customer says it's different or no matches: Continue gathering details for a new ticket`,
    inputSchema: SearchLinearIssuesParams,
    execute: async ({ query }: z.infer<typeof SearchLinearIssuesParams>) => {
      if (!selectedProject?.id) {
        throw new Error("No project selected. Please select a Linear project first.");
      }

      try {
        const issues = await searchLinearIssues(selectedProject.id, query, {
          maxResults: 10,
          retryOnError: true,
        });

        // Return structured data for the AI to process
        return {
          success: true,
          foundIssues: issues.length > 0,
          issueCount: issues.length,
          issues: issues.map((issue) => ({
            title: issue.title,
            identifier: issue.identifier,
            state: issue.state,
            description: issue.description ? issue.description.substring(0, 200) : null,
            matchType: issue.matchType,
            relevanceScore: issue.relevanceScore,
            priority: issue.priority,
          })),
          // Customer-friendly message for presentation
          customerMessage:
            issues.length > 0
              ? `I found ${issues.length} similar request${issues.length === 1 ? "" : "s"} in our system.`
              : `I didn't find any similar requests.`,
          // Include full details for AI processing
          _internal: {
            allIssues: issues,
          },
        };
      } catch (error) {
        console.error("Failed to search Linear issues:", error);
        // Return error response instead of throwing
        return {
          success: false,
          foundIssues: false,
          issueCount: 0,
          issues: [],
          error: error instanceof Error ? error.message : "Unknown error",
          customerMessage:
            "I'm experiencing some connectivity issues with the search. Let me gather a bit more information so I can create a comprehensive ticket for you.",
        };
      }
    },
  });
