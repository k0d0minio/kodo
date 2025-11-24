import type { LinearProject } from "@/components/linear-project-selector";
import { getLinearProjects } from "./client";

export async function getProjectByKey(projectKey: string): Promise<LinearProject | null> {
  try {
    const projects = await getLinearProjects();
    const normalizedKey = projectKey.toUpperCase().trim();

    const project = projects.find((p) => p.key.toUpperCase() === normalizedKey);

    return project || null;
  } catch (error) {
    console.error("Failed to fetch project by key:", error);
    return null;
  }
}
