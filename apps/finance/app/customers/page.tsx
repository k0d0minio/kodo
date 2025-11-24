import { CustomersList } from "@/components/customers/customers-list";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/supabase/auth";

export default async function CustomersPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Customer Management"
        description="Manage your customers and invoice details"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <CustomersList />
      </div>
    </div>
  );
}
