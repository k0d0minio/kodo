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
import { Textarea } from "@/components/ui/textarea";
import { autoCategorizeExpense } from "@/lib/expense-categorization";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  receipt_url: z.string().url().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Project {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  expense?: {
    id: string;
    amount: number;
    description?: string | null;
    category?: string | null;
    vendor?: string | null;
    date: string;
    receipt_url?: string | null;
    project_id?: string | null;
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

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [autoCategorizing, setAutoCategorizing] = useState(false);
  const supabase = createClient();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount || 0,
      description: expense?.description || "",
      category: expense?.category || "",
      vendor: expense?.vendor || "",
      date: expense?.date || new Date().toISOString().split("T")[0],
      receipt_url: expense?.receipt_url || "",
      project_id: expense?.project_id || "__none__",
    },
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error loading projects:", error);
    } else {
      setProjects(data || []);
    }
  }

  async function handleAutoCategorize() {
    const values = form.getValues();
    if (!values.vendor && !values.description && !values.amount) {
      return;
    }

    setAutoCategorizing(true);
    try {
      const category = await autoCategorizeExpense({
        vendor: values.vendor,
        description: values.description,
        amount: values.amount,
      });

      if (category) {
        form.setValue("category", category);
      }
    } catch (error) {
      console.error("Error auto-categorizing:", error);
    } finally {
      setAutoCategorizing(false);
    }
  }

  async function onSubmit(values: ExpenseFormValues) {
    setLoading(true);
    try {
      const expenseData = {
        amount: values.amount,
        description: values.description || null,
        category: values.category || null,
        vendor: values.vendor || null,
        date: values.date,
        receipt_url: values.receipt_url || null,
        project_id: values.project_id === "__none__" ? null : values.project_id || null,
      };

      if (expense) {
        // Update existing expense
        const { error } = await supabase.from("expenses").update(expenseData).eq("id", expense.id);

        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await supabase.from("expenses").insert(expenseData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Amazon, Starbucks" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Expense description" {...field} />
              </FormControl>
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
              <FormControl>
                <div className="flex gap-2">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoCategorize}
                    disabled={autoCategorizing}
                  >
                    {autoCategorizing ? "Categorizing..." : "Auto-Categorize"}
                  </Button>
                </div>
              </FormControl>
              <FormDescription>Use Auto-Categorize to apply expense rules</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project (Optional)</FormLabel>
              <Select
                value={field.value || "__none__"}
                onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
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
          name="receipt_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receipt URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : expense ? "Update" : "Create"} Expense
          </Button>
        </div>
      </form>
    </Form>
  );
}
