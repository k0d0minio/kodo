import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type ParsedExpense, parseBankStatementCSV } from "@/lib/bank-statement-parser";
import type { ExpenseData, ExpenseRule } from "@/lib/expense-categorization";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Server-side auto-categorization function
 */
async function autoCategorizeExpenseServer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  expense: ExpenseData,
): Promise<string | null> {
  // Get all active rules for the current user, ordered by priority (highest first)
  const { data: rules, error } = await supabase
    .from("expense_rules")
    .select("*")
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error || !rules || rules.length === 0) {
    return null;
  }

  // Find the first matching rule (highest priority)
  for (const rule of rules) {
    if (matchesRule(expense, rule)) {
      return rule.category;
    }
  }

  return null;
}

/**
 * Matches an expense against a rule based on the pattern type
 */
function matchesRule(expense: ExpenseData, rule: ExpenseRule): boolean {
  if (!rule.active) return false;

  switch (rule.pattern_type) {
    case "vendor":
      if (!expense.vendor) return false;
      return expense.vendor.toLowerCase().includes(rule.pattern_value.toLowerCase());

    case "description":
      if (!expense.description) return false;
      return expense.description.toLowerCase().includes(rule.pattern_value.toLowerCase());

    case "amount_range": {
      if (!expense.amount) return false;
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

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const filePath = formData.get("filePath") as string | null;

    let csvContent: string;

    if (file) {
      // Handle file upload
      csvContent = await file.text();
    } else if (filePath) {
      // Handle file path (for public folder imports)
      const fullPath = join(process.cwd(), "public", filePath);
      csvContent = await readFile(fullPath, "utf-8");
    } else {
      return NextResponse.json(
        { error: "Either file or filePath must be provided" },
        { status: 400 },
      );
    }

    // Parse CSV
    let parsedExpenses: ParsedExpense[];
    try {
      parsedExpenses = parseBankStatementCSV(csvContent);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: `Failed to parse CSV: ${message}` }, { status: 400 });
    }

    if (parsedExpenses.length === 0) {
      return NextResponse.json({ error: "No expenses found in CSV file" }, { status: 400 });
    }

    // Process expenses with auto-categorization
    const expensesToInsert = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < parsedExpenses.length; i++) {
      const parsed = parsedExpenses[i];

      try {
        // Auto-categorize
        const category = await autoCategorizeExpenseServer(supabase, {
          vendor: parsed.vendor || undefined,
          description: parsed.description || undefined,
          amount: parsed.amount,
        });

        expensesToInsert.push({
          user_id: user.id,
          amount: parsed.amount,
          description: parsed.description,
          category: category,
          vendor: parsed.vendor,
          date: parsed.date,
          transaction_started_at: parsed.transaction_started_at,
          transaction_completed_at: parsed.transaction_completed_at,
          receipt_url: null,
          project_id: null,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        errors.push({
          row: i + 2, // +2 because CSV has header row and 0-indexed
          error: message,
        });
      }
    }

    // Bulk insert expenses (in batches of 100 to avoid overwhelming the database)
    const batchSize = 100;
    let successCount = 0;
    const insertErrors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < expensesToInsert.length; i += batchSize) {
      const batch = expensesToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase.from("expenses").insert(batch);

      if (insertError) {
        // If batch insert fails, try individual inserts to identify problematic rows
        for (let j = 0; j < batch.length; j++) {
          const { error: singleError } = await supabase.from("expenses").insert(batch[j]);

          if (singleError) {
            insertErrors.push({
              row: i + j + 2,
              error: singleError.message,
            });
          } else {
            successCount++;
          }
        }
      } else {
        successCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      total: parsedExpenses.length,
      errors: [...errors, ...insertErrors],
    });
  } catch (error: unknown) {
    console.error("Error importing expenses:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
