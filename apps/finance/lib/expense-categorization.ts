import { createClient } from "@/lib/supabase/client";

export interface ExpenseRule {
  id: string;
  name: string;
  pattern_type: "vendor" | "description" | "amount_range";
  pattern_value: string;
  category: string;
  priority: number;
  active: boolean;
}

export interface ExpenseData {
  vendor?: string;
  description?: string;
  amount?: number;
}

/**
 * Matches an expense against a rule based on the pattern type
 */
function matchesRule(expense: ExpenseData, rule: ExpenseRule): boolean {
  if (!rule.active) return false;

  switch (rule.pattern_type) {
    case "vendor":
      if (!expense.vendor) return false;
      // Case-insensitive contains match
      return expense.vendor.toLowerCase().includes(rule.pattern_value.toLowerCase());

    case "description":
      if (!expense.description) return false;
      // Case-insensitive contains match
      return expense.description.toLowerCase().includes(rule.pattern_value.toLowerCase());

    case "amount_range": {
      if (!expense.amount) return false;
      // Parse range like "0-100" or ">1000"
      const range = rule.pattern_value.trim();
      if (range.startsWith(">")) {
        const min = Number.parseFloat(range.substring(1));
        return expense.amount > min;
      }
      if (range.startsWith("<")) {
        const max = Number.parseFloat(range.substring(1));
        return expense.amount < max;
      }
      if (range.includes("-")) {
        const [minStr, maxStr] = range.split("-").map((s) => s.trim());
        const min = Number.parseFloat(minStr);
        const max = Number.parseFloat(maxStr);
        return expense.amount >= min && expense.amount <= max;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Auto-categorize an expense based on matching rules
 * Returns the category from the highest priority matching rule, or null if no match
 */
export async function autoCategorizeExpense(expense: ExpenseData): Promise<string | null> {
  const supabase = createClient();

  // Get all active rules for the current user, ordered by priority (highest first)
  const { data: rules, error } = await supabase
    .from("expense_rules")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching expense rules:", error);
    return null;
  }

  if (!rules || rules.length === 0) {
    return null;
  }

  // Find the first matching rule (highest priority)
  for (const rule of rules as ExpenseRule[]) {
    if (matchesRule(expense, rule)) {
      return rule.category;
    }
  }

  return null;
}

/**
 * Test an expense against all rules and return matching rules
 * Useful for preview/testing functionality
 */
export async function testExpenseRules(
  expense: ExpenseData,
): Promise<Array<{ rule: ExpenseRule; matches: boolean }>> {
  const supabase = createClient();

  const { data: rules, error } = await supabase
    .from("expense_rules")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching expense rules:", error);
    return [];
  }

  if (!rules) {
    return [];
  }

  return (rules as ExpenseRule[]).map((rule) => ({
    rule,
    matches: matchesRule(expense, rule),
  }));
}
