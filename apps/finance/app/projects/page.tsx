import { PageHeader } from "@/components/page-header";
import { ProjectsList } from "@/components/projects/projects-list";
import { requireAuth } from "@/lib/supabase/auth";

export default async function ProjectsPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Projects"
        description="Manage your projects and track their progress"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <ProjectsList />
      </div>
    </div>
  );
}
