"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const expenseRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  pattern_type: z.enum(["vendor", "description", "amount_range"]),
  pattern_value: z.string().min(1, "Pattern value is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.coerce.number().int().min(0),
  active: z.boolean(),
});

type ExpenseRuleFormValues = z.infer<typeof expenseRuleSchema>;

interface ExpenseRuleFormProps {
  rule?: {
    id: string;
    name: string;
    pattern_type: "vendor" | "description" | "amount_range";
    pattern_value: string;
    category: string;
    priority: number;
    active: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const COMMON_CATEGORIES = [
  "Equipment",
  "Travel",
  "Software",
  "Office Supplies",
  "Meals",
  "Utilities",
  "Subscriptions",
  "Marketing",
  "Professional Services",
  "Other",
];

export function ExpenseRuleForm({ rule, onSuccess, onCancel }: ExpenseRuleFormProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<ExpenseRuleFormValues>({
    resolver: zodResolver(expenseRuleSchema),
    defaultValues: {
      name: rule?.name || "",
      pattern_type: rule?.pattern_type || "vendor",
      pattern_value: rule?.pattern_value || "",
      category: rule?.category || "",
      priority: rule?.priority ?? 0,
      active: rule?.active ?? true,
    },
  });

  const patternType = form.watch("pattern_type");

  async function onSubmit(values: ExpenseRuleFormValues) {
    setLoading(true);
    try {
      if (rule) {
        // Update existing rule
        const { error } = await supabase.from("expense_rules").update(values).eq("id", rule.id);

        if (error) throw error;
      } else {
        // Create new rule
        const { error } = await supabase.from("expense_rules").insert(values);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving expense rule:", error);
      alert("Failed to save expense rule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Starbucks Meals" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pattern_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pattern Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vendor">Vendor Name</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="amount_range">Amount Range</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pattern_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pattern Value</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    patternType === "vendor"
                      ? "e.g., Starbucks"
                      : patternType === "description"
                        ? "e.g., coffee"
                        : "e.g., 0-50 or >1000"
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {patternType === "vendor" &&
                  "Matches if vendor name contains this text (case-insensitive)"}
                {patternType === "description" &&
                  "Matches if description contains this text (case-insensitive)"}
                {patternType === "amount_range" &&
                  "Use format: '0-100' for range, '>1000' for greater than, '<50' for less than"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMMON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} />
              </FormControl>
              <FormDescription>
                Higher priority rules are checked first. Default is 0.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Only active rules are used for auto-categorization
                </FormDescription>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : rule ? "Update" : "Create"} Rule
          </Button>
        </div>
      </form>
    </Form>
  );
}
