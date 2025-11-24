import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/supabase/auth";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireAuth();
  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Invoice Details"
        description="View and manage invoice"
        backHref="/invoices"
      />

      <div className="container mx-auto px-4 py-6">
        <InvoiceDetail invoiceId={id} />
      </div>
    </div>
  );
}
