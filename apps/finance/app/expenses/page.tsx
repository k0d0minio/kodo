import { BusinessExpenseCategories } from "@/components/expenses/business-expense-categories";
import { BusinessExpenseTrends } from "@/components/expenses/business-expense-trends";
import { ExpensesList } from "@/components/expenses/expenses-list";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/supabase/auth";
import { Settings } from "lucide-react";
import Link from "next/link";

export default async function ExpensesPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Business Expenses"
        description="Track and manage your professional expenses"
        backHref="/dashboard"
        actions={
          <Link href="/expense-rules">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Expense Rules
            </Button>
          </Link>
        }
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Main Expenses List */}
        <ExpensesList />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BusinessExpenseTrends />
          <BusinessExpenseCategories />
        </div>
      </div>
    </div>
  );
}
