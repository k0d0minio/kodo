import { ExpenseRulesList } from "@/components/expense-rules/expense-rules-list";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/supabase/auth";

export default async function ExpenseRulesPage() {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <PageHeader
        title="Expense Rules"
        description="Automatically categorize expenses with rules"
        backHref="/dashboard"
      />

      <div className="container mx-auto px-4 py-6">
        <ExpenseRulesList />
      </div>
    </div>
  );
}
