import { NextResponse } from "next/server";
import { getLinearProjects } from "@/lib/linear/client";

export async function GET() {
  try {
    const projects = await getLinearProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Failed to fetch Linear projects:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Linear projects",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
