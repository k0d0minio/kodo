"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// Dummy data - last 6 months
const monthlyData = [
  { month: "Aug", expenses: 4800 },
  { month: "Sep", expenses: 5200 },
  { month: "Oct", expenses: 5100 },
  { month: "Nov", expenses: 4900 },
  { month: "Dec", expenses: 5220 },
  { month: "Jan", expenses: 5220 },
];

const chartConfig = {
  expenses: {
    label: "Business Expenses",
    color: "hsl(var(--chart-2))",
  },
};

export function BusinessExpenseTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Trends</CardTitle>
        <CardDescription>Monthly business expense trends over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
