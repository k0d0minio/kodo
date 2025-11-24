import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { ExpenseBreakdown } from "@/components/dashboard/expense-breakdown";
import { InvoiceSection } from "@/components/dashboard/invoice-section";
import { MonthlyTrends } from "@/components/dashboard/monthly-trends";
import { TimeTrackingSection } from "@/components/dashboard/time-tracking";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/supabase/auth";

export default async function DashboardPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader title="Kodo Budget" />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Budget Overview Cards */}
        <BudgetOverview />

        {/* Time Tracking Section */}
        <TimeTrackingSection />

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <ExpenseBreakdown />
          <MonthlyTrends />
        </div>

        {/* Invoice Section */}
        <InvoiceSection />
      </div>
    </div>
  );
}
