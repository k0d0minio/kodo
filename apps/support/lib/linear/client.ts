import { LinearClient } from "@linear/sdk";

let linearClient: LinearClient | null = null;

export function getLinearClient(): LinearClient {
  if (!linearClient) {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
      throw new Error("LINEAR_API_KEY environment variable is required");
    }

    linearClient = new LinearClient({
      apiKey,
    });
  }

  return linearClient;
}

export async function getLinearTeamId(): Promise<string> {
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!teamId) {
    throw new Error("LINEAR_TEAM_ID environment variable is required");
  }
  return teamId;
}

export async function getLinearProjects(): Promise<
  Array<{ id: string; name: string; key: string }>
> {
  try {
    const client = getLinearClient();
    const _teamId = await getLinearTeamId();

    // Get all projects without filtering by team (projects are team-specific by default)
    const result = await client.projects({
      first: 50, // Limit to 50 projects
    });

    if (!result.nodes) {
      return [];
    }

    return result.nodes.map((project) => ({
      id: project.id,
      name: project.name,
      key: project.name.substring(0, 3).toUpperCase(), // Generate a key from the name
    }));
  } catch (error) {
    console.error("Failed to fetch Linear projects:", error);
    throw error; // Re-throw to see the full error
  }
}

export async function getLinearIssuesByProject(
  projectId: string,
  options?: {
    limit?: number;
    statusFilter?: string;
  },
): Promise<any[]> {
  try {
    const client = getLinearClient();

    const result = await client.issues({
      first: options?.limit || 20,
      filter: {
        project: { id: { eq: projectId } },
        ...(options?.statusFilter && { state: { name: { eq: options.statusFilter } } }),
      },
    });

    if (!result.nodes) {
      return [];
    }

    return result.nodes.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      state: issue.state?.name || "unknown",
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      url: issue.url,
      identifier: issue.identifier,
    }));
  } catch (error) {
    console.error("Failed to fetch Linear issues:", error);
    throw error;
  }
}

export async function getLinearProjectMetadata(projectId: string): Promise<{
  name: string;
  description: string;
  milestones: any[];
  startDate: Date | null;
  targetDate: Date | null;
  progress: number;
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  status: string;
}> {
  try {
    const client = getLinearClient();

    const result = await client.project(projectId);

    if (!result) {
      throw new Error("Project not found");
    }

    // Fetch all issues for the project to calculate progress
    let allIssues: any[] = [];
    let hasMore = true;
    let cursor: string | null = null;

    while (hasMore) {
      const issuesResult = await client.issues({
        first: 100,
        filter: {
          project: { id: { eq: projectId } },
        },
        ...(cursor && { after: cursor }),
      });

      if (issuesResult.nodes) {
        allIssues = [...allIssues, ...issuesResult.nodes];
      }

      hasMore = issuesResult.pageInfo?.hasNextPage ?? false;
      cursor = issuesResult.pageInfo?.endCursor ?? null;
    }

    // Calculate issue statistics
    const totalIssues = allIssues.length;
    const completedIssues = allIssues.filter(
      (issue) => issue.state?.type === "completed" || issue.state?.name?.toLowerCase() === "done",
    ).length;
    const inProgressIssues = allIssues.filter(
      (issue) =>
        issue.state?.type === "started" || issue.state?.name?.toLowerCase() === "in progress",
    ).length;

    // Calculate progress percentage
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    // Get project status
    const status = result.state || "active";

    return {
      name: result.name,
      description: result.description || "",
      milestones: [], // Linear doesn't have milestones in the basic project type
      startDate: result.startedAt ? new Date(result.startedAt) : null,
      targetDate: result.targetDate ? new Date(result.targetDate) : null,
      progress,
      totalIssues,
      completedIssues,
      inProgressIssues,
      status: typeof status === "string" ? status : "active",
    };
  } catch (error) {
    console.error("Failed to fetch Linear project metadata:", error);
    throw error;
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Generate multiple search query variations from a user query
 */
function generateSearchQueries(query: string): string[] {
  const queries: string[] = [];
  const trimmed = query.trim();

  // Original query
  queries.push(trimmed);

  // Extract key terms (words longer than 3 characters)
  const words = trimmed.split(/\s+/).filter((w) => w.length > 3);
  if (words.length > 0) {
    // Try with just key terms
    queries.push(words.join(" "));

    // Try individual key terms if multiple exist
    if (words.length > 1) {
      queries.push(...words);
    }
  }

  // Remove duplicates while preserving order
  return Array.from(new Set(queries));
}

export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  state: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  identifier: string;
  matchType?: "title" | "description" | "both";
  relevanceScore?: number;
}

export async function searchLinearIssues(
  projectId: string,
  query: string,
  options?: {
    maxResults?: number;
    retryOnError?: boolean;
  },
): Promise<SearchResult[]> {
  const maxResults = options?.maxResults || 10;
  const retryOnError = options?.retryOnError !== false;

  const searchFunction = async (): Promise<SearchResult[]> => {
    const client = getLinearClient();
    const allResults = new Map<string, SearchResult>();

    // Generate multiple query variations
    const searchQueries = generateSearchQueries(query);

    // Search in title
    for (const searchQuery of searchQueries) {
      try {
        const titleResult = await client.issues({
          first: maxResults,
          filter: {
            project: { id: { eq: projectId } },
            title: { containsIgnoreCase: searchQuery },
          },
        });

        if (titleResult.nodes) {
          for (const issue of titleResult.nodes) {
            const existing = allResults.get(issue.id);
            if (!existing) {
              allResults.set(issue.id, {
                id: issue.id,
                title: issue.title,
                description: issue.description || null,
                priority: issue.priority,
                state: issue.state?.name || "unknown",
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                url: issue.url,
                identifier: issue.identifier,
                matchType: "title",
                relevanceScore: 1,
              });
            } else if (existing.matchType === "description") {
              existing.matchType = "both";
              existing.relevanceScore = (existing.relevanceScore || 1) + 1;
            } else {
              existing.relevanceScore = (existing.relevanceScore || 1) + 0.5;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to search titles with query "${searchQuery}":`, error);
        // Continue with other queries
      }
    }

    // Search in description
    for (const searchQuery of searchQueries) {
      try {
        const descResult = await client.issues({
          first: maxResults,
          filter: {
            project: { id: { eq: projectId } },
            description: { containsIgnoreCase: searchQuery },
          },
        });

        if (descResult.nodes) {
          for (const issue of descResult.nodes) {
            const existing = allResults.get(issue.id);
            if (!existing) {
              allResults.set(issue.id, {
                id: issue.id,
                title: issue.title,
                description: issue.description || null,
                priority: issue.priority,
                state: issue.state?.name || "unknown",
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                url: issue.url,
                identifier: issue.identifier,
                matchType: "description",
                relevanceScore: 0.5,
              });
            } else if (existing.matchType === "title") {
              existing.matchType = "both";
              existing.relevanceScore = (existing.relevanceScore || 1) + 1;
            } else if (existing.matchType === "description") {
              existing.relevanceScore = (existing.relevanceScore || 0.5) + 0.3;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to search descriptions with query "${searchQuery}":`, error);
        // Continue with other queries
      }
    }

    // Convert to array and sort by relevance
    const results = Array.from(allResults.values());
    results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Limit to maxResults
    return results.slice(0, maxResults);
  };

  try {
    if (retryOnError) {
      return await retryWithBackoff(searchFunction);
    }
    return await searchFunction();
  } catch (error) {
    console.error("Failed to search Linear issues after retries:", error);
    throw error;
  }
}

export async function createLinearComment(issueId: string, body: string): Promise<void> {
  try {
    const client = getLinearClient();

    const result = await client.createComment({
      issueId,
      body,
    });

    if (!result.success) {
      throw new Error("Failed to create Linear comment");
    }
  } catch (error) {
    console.error("Failed to create Linear comment:", error);
    throw error;
  }
}
