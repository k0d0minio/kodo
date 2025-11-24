import { PageHeader } from "@/components/page-header";
import { RecurringInvoicesList } from "@/components/recurring-invoices/recurring-invoices-list";
import { requireAuth } from "@/lib/supabase/auth";

export default async function RecurringInvoicesPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Recurring Invoices"
        description="Automatically generate invoices on a schedule"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <RecurringInvoicesList />
      </div>
    </div>
  );
}
