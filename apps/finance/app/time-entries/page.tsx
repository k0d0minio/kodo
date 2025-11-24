import { PageHeader } from "@/components/page-header";
import { TimeEntriesList } from "@/components/time-entries/time-entries-list";
import { requireAuth } from "@/lib/supabase/auth";

export default async function TimeEntriesPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Time Entries"
        description="Manage your tracked work hours"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <TimeEntriesList />
      </div>
    </div>
  );
}
