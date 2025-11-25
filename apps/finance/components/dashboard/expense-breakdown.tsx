"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function ExpenseBreakdown() {
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<
    Array<{ name: string; value: number; fill: string }>
  >([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    loadExpenseData();
  }, []);

  async function loadExpenseData() {
    try {
      setLoading(true);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      // Get expenses for this month
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount, category")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      const typedExpenses = (expenses as Array<{ category: string | null; amount: number }> | null) ?? [];
      
      if (typedExpenses.length === 0) {
        setExpenseData([]);
        setTotalExpenses(0);
        return;
      }

      // Group by category
      const categoryMap = new Map<string, number>();
      let total = 0;

      for (const exp of typedExpenses) {
        const category = exp.category || "Uncategorized";
        const amount = exp.amount || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        total += amount;
      }

      // Convert to array and sort by value
      const data = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value,
          fill: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categories

      setExpenseData(data);
      setTotalExpenses(total);
    } catch (error) {
      console.error("Error loading expense data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (expenseData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Expenses</CardTitle>
              <CardDescription>Breakdown by category this month</CardDescription>
            </div>
            <Link href="/expenses">
              <Button variant="ghost" size="sm">
                View Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No expenses this month</p>
            <Link href="/expenses">
              <Button variant="outline" size="sm" className="mt-4">
                Add Expense
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Business Expenses</CardTitle>
            <CardDescription>Breakdown by category this month</CardDescription>
          </div>
          <Link href="/expenses">
            <Button variant="ghost" size="sm">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Business Expenses</p>
          <p className="text-3xl font-bold">
            €
            {totalExpenses.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
