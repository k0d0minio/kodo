import { InvoicesList } from "@/components/invoices/invoices-list";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/supabase/auth";

export default async function InvoicesPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Invoices"
        description="Manage and generate invoices"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <InvoicesList />
      </div>
    </div>
  );
}
