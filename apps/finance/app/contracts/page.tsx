import { ContractsList } from "@/components/contracts/contracts-list";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/supabase/auth";

export default async function ContractsPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Contracts"
        description="Manage your client contracts and agreements"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <ContractsList />
      </div>
    </div>
  );
}
