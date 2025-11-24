import { PageHeader } from "@/components/page-header";
import { ProjectDetail } from "@/components/projects/project-detail";
import { requireAuth } from "@/lib/supabase/auth";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAuth();
  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Project Details"
        description="View project information, time entries, and expenses"
        backHref="/projects"
      />

      <div className="container mx-auto px-4 py-6">
        <ProjectDetail projectId={id} />
      </div>
    </div>
  );
}
