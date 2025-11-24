"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Briefcase, TrendingUp } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

// Dummy data
const businessExpenses = [
  { name: "Equipment", value: 1800, fill: "hsl(var(--chart-2))" },
  { name: "Travel", value: 1200, fill: "hsl(var(--chart-1))" },
  { name: "Software", value: 850, fill: "hsl(var(--chart-3))" },
  { name: "Office Supplies", value: 450, fill: "hsl(var(--chart-4))" },
  { name: "Meals", value: 420, fill: "hsl(var(--chart-5))" },
  { name: "Utilities", value: 320, fill: "hsl(var(--chart-1))" },
  { name: "Subscriptions", value: 180, fill: "hsl(var(--chart-2))" },
];

const businessMonthly = [
  { month: "Aug", amount: 4800 },
  { month: "Sep", amount: 5200 },
  { month: "Oct", amount: 5100 },
  { month: "Nov", amount: 4900 },
  { month: "Dec", amount: 5220 },
  { month: "Jan", amount: 5220 },
];

const chartConfig = {
  Equipment: { label: "Equipment", color: "hsl(var(--chart-2))" },
  Travel: { label: "Travel", color: "hsl(var(--chart-1))" },
  Software: { label: "Software", color: "hsl(var(--chart-3))" },
  "Office Supplies": { label: "Office Supplies", color: "hsl(var(--chart-4))" },
  Meals: { label: "Meals", color: "hsl(var(--chart-5))" },
  Utilities: { label: "Utilities", color: "hsl(var(--chart-1))" },
  Subscriptions: { label: "Subscriptions", color: "hsl(var(--chart-2))" },
};

const totalBusiness = businessExpenses.reduce((sum, item) => sum + item.value, 0);

export function BusinessExpenses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-green-600" />
          Business Expense Overview
        </CardTitle>
        <CardDescription>Track and manage your professional expenses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold">€{totalBusiness.toLocaleString()}</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
            <p className="text-sm text-muted-foreground">Average Monthly</p>
            <p className="text-2xl font-bold">
              €
              {Math.round(
                businessMonthly.reduce((sum, m) => sum + m.amount, 0) / businessMonthly.length,
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pie Chart */}
        <div>
          <h3 className="mb-4 text-sm font-medium">Category Breakdown</h3>
          <ChartContainer config={chartConfig} className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={businessExpenses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {businessExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Category List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Top Categories</h3>
          {businessExpenses
            .sort((a, b) => b.value - a.value)
            .map((expense) => (
              <div
                key={expense.name}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: expense.fill }} />
                  <span className="text-sm font-medium">{expense.name}</span>
                </div>
                <span className="font-bold">€{expense.value.toLocaleString()}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
