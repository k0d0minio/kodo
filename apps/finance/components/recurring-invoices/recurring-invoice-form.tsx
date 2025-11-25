"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, addQuarters, addYears } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const recurringInvoiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customer_id: z.string().uuid("Please select a customer"),
  project_id: z.string().uuid().optional().or(z.literal("")),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  next_invoice_date: z.string().min(1, "Next invoice date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
  active: z.boolean(),
});

type RecurringInvoiceFormValues = z.infer<typeof recurringInvoiceSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
}

interface RecurringInvoiceFormProps {
  recurringInvoice?: {
    id: string;
    name: string;
    customer_id: string;
    project_id?: string | null;
    frequency: "monthly" | "quarterly" | "yearly";
    next_invoice_date: string;
    amount: number;
    description?: string | null;
    active: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecurringInvoiceForm({
  recurringInvoice,
  onSuccess,
  onCancel,
}: RecurringInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const supabase = createClient();

  const form = useForm<RecurringInvoiceFormValues>({
    resolver: zodResolver(recurringInvoiceSchema),
    defaultValues: {
      name: recurringInvoice?.name || "",
      customer_id: recurringInvoice?.customer_id || "",
      project_id: recurringInvoice?.project_id || "__none__",
      frequency: recurringInvoice?.frequency || "monthly",
      next_invoice_date:
        recurringInvoice?.next_invoice_date || new Date().toISOString().split("T")[0],
      amount: recurringInvoice?.amount || 0,
      description: recurringInvoice?.description || "",
      active: recurringInvoice?.active ?? true,
    },
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const customerId = form.watch("customer_id");
    if (customerId) {
      setSelectedCustomerId(customerId);
      loadProjects(customerId);
    } else {
      setProjects([]);
    }
  }, [form.watch("customer_id")]);

  async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("id, name").order("name");

    if (error) {
      console.error("Error loading customers:", error);
    } else {
      setCustomers(data || []);
    }
  }

  async function loadProjects(customerId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, customer_id")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error loading projects:", error);
    } else {
      setProjects(data || []);
    }
  }

  function calculateNextDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);
    let nextDate: Date;

    switch (frequency) {
      case "monthly":
        nextDate = addMonths(date, 1);
        break;
      case "quarterly":
        nextDate = addQuarters(date, 1);
        break;
      case "yearly":
        nextDate = addYears(date, 1);
        break;
      default:
        nextDate = date;
    }

    return nextDate.toISOString().split("T")[0];
  }

  async function onSubmit(values: RecurringInvoiceFormValues) {
    setLoading(true);
    try {
      const recurringInvoiceData = {
        name: values.name,
        customer_id: values.customer_id,
        project_id: values.project_id === "__none__" ? null : values.project_id || null,
        frequency: values.frequency,
        next_invoice_date: values.next_invoice_date,
        amount: values.amount,
        description: values.description || null,
        active: values.active,
      };

      if (recurringInvoice) {
        // Update existing recurring invoice
        const { error } = await supabase
          .from("recurring_invoices")
          .update(recurringInvoiceData as never)
          .eq("id", recurringInvoice.id);

        if (error) throw error;
      } else {
        // Create new recurring invoice
        const { error } = await supabase.from("recurring_invoices").insert(recurringInvoiceData as never);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving recurring invoice:", error);
      alert("Failed to save recurring invoice. Please try again.");
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
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Monthly Retainer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
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
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project (Optional)</FormLabel>
                <Select
                  value={field.value || "__none__"}
                  onValueChange={(value) => field.onChange(value === "__none__" ? null : value)}
                  disabled={!selectedCustomerId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedCustomerId ? "Select project" : "Select customer first"
                        }
                      />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="next_invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Next Invoice Date *</FormLabel>
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (€) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
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
                <Textarea placeholder="Invoice description" {...field} />
              </FormControl>
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
                <p className="text-sm text-muted-foreground">
                  Only active recurring invoices will generate invoices
                </p>
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
            {loading ? "Saving..." : recurringInvoice ? "Update" : "Create"} Recurring Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
