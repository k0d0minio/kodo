"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Euro, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

export function BudgetOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    remaining: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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

      // Get paid invoices (income) for this month
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("status", "paid")
        .gte("issue_date", startOfMonth)
        .lte("issue_date", endOfMonth);

      // Get expenses for this month
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth);

      const totalIncome = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const remaining = totalIncome - totalExpenses;

      setData({
        totalIncome,
        totalExpenses,
        remaining,
      });
    } catch (error) {
      console.error("Error loading budget data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const expensePercentage =
    data.totalIncome > 0 ? (data.totalExpenses / data.totalIncome) * 100 : 0;
  const remainingPercentage = data.totalIncome > 0 ? (data.remaining / data.totalIncome) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €
            {data.totalIncome.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">This month (paid invoices)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €
            {data.totalExpenses.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.totalIncome > 0 ? `${expensePercentage.toFixed(1)}% of income` : "This month"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${data.remaining >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            €
            {data.remaining.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.totalIncome > 0 ? `${remainingPercentage.toFixed(1)}% of income` : "This month"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
