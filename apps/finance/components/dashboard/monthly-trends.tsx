"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
};

export function MonthlyTrends() {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: string; income: number; expenses: number }>
  >([]);
  const supabase = createClient();

  useEffect(() => {
    loadMonthlyData();
  }, []);

  async function loadMonthlyData() {
    try {
      setLoading(true);

      // Get last 6 months
      const months: Array<{ month: string; startDate: string; endDate: string }> = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        months.push({ month: monthName, startDate, endDate });
      }

      // Get invoices and expenses for each month
      const dataPromises = months.map(async ({ month, startDate, endDate }) => {
        // Get paid invoices (income) for this month
        const { data: invoices } = await supabase
          .from("invoices")
          .select("total")
          .eq("status", "paid")
          .gte("issue_date", startDate)
          .lte("issue_date", endDate);

        // Get expenses for this month
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);

        const income = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const expensesTotal = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

        return { month, income, expenses: expensesTotal };
      });

      const data = await Promise.all(dataPromises);
      setMonthlyData(data);
    } catch (error) {
      console.error("Error loading monthly data:", error);
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

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trends</CardTitle>
        <CardDescription>Income vs Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
