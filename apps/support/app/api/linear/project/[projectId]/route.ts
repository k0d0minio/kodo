import { NextResponse } from "next/server";
import { getLinearProjectMetadata } from "@/lib/linear/client";

export async function GET(_request: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const metadata = await getLinearProjectMetadata(projectId);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Failed to fetch Linear project metadata:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch Linear project metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
