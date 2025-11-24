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
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
  generatePaymentLinkToken,
} from "@/lib/invoices";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit_price: z.coerce.number().positive("Price must be positive"),
  time_entry_id: z.string().uuid().optional().or(z.literal("")),
});

const invoiceSchema = z.object({
  customer_id: z.string().uuid("Please select a customer"),
  project_id: z.string().uuid().optional().or(z.literal("")),
  invoice_number: z.string().min(1, "Invoice number is required"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  tax_rate: z.coerce.number().min(0).max(100),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number | null;
  description: string | null;
  customers: {
    hourly_rate: number | null;
  };
}

interface InvoiceFormProps {
  invoice?: {
    id: string;
    customer_id: string;
    project_id?: string | null;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    tax_rate: number;
    notes?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const supabase = createClient();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: invoice?.customer_id || "",
      project_id: invoice?.project_id ? invoice.project_id : "__none__",
      invoice_number: invoice?.invoice_number || "",
      issue_date: invoice?.issue_date || new Date().toISOString().split("T")[0],
      due_date:
        invoice?.due_date ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      tax_rate: invoice?.tax_rate || 0,
      items: [],
      notes: invoice?.notes || "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    loadCustomers();
    if (invoice) {
      loadInvoiceItems();
    } else {
      generateNewInvoiceNumber();
    }
  }, []);

  useEffect(() => {
    const customerId = form.watch("customer_id");
    if (customerId) {
      setSelectedCustomerId(customerId);
      loadProjects(customerId);
      loadTimeEntries(customerId);
    } else {
      setProjects([]);
      setTimeEntries([]);
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

  async function loadTimeEntries(customerId: string) {
    const { data, error } = await supabase
      .from("time_entries")
      .select(`
        id,
        date,
        hours,
        description,
        customers:customer_id (
          hourly_rate
        )
      `)
      .eq("customer_id", customerId)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading time entries:", error);
    } else {
      setTimeEntries(data || []);
    }
  }

  async function generateNewInvoiceNumber() {
    const number = await generateInvoiceNumber();
    form.setValue("invoice_number", number);
  }

  async function loadInvoiceItems() {
    if (!invoice) return;

    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id)
      .order("created_at");

    if (error) {
      console.error("Error loading invoice items:", error);
    } else if (data) {
      form.setValue(
        "items",
        data.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          time_entry_id: item.time_entry_id || "",
        })),
      );
    }
  }

  function addTimeEntryAsItem(timeEntry: TimeEntry) {
    const hourlyRate = timeEntry.customers?.hourly_rate || 0;
    const hours = timeEntry.hours || 0;
    const description =
      timeEntry.description || `Time entry for ${new Date(timeEntry.date).toLocaleDateString()}`;

    append({
      description,
      quantity: hours,
      unit_price: hourlyRate,
      time_entry_id: timeEntry.id,
    });
  }

  async function onSubmit(values: InvoiceFormValues) {
    setLoading(true);
    try {
      const totals = calculateInvoiceTotals(values.items, values.tax_rate);

      const invoiceData = {
        customer_id: values.customer_id,
        project_id: values.project_id === "__none__" ? null : values.project_id || null,
        invoice_number: values.invoice_number,
        issue_date: values.issue_date,
        due_date: values.due_date,
        subtotal: totals.subtotal,
        tax_rate: values.tax_rate,
        tax_amount: totals.taxAmount,
        total: totals.total,
        notes: values.notes || null,
        payment_link_token: invoice ? undefined : generatePaymentLinkToken(),
      };

      let invoiceId: string;

      if (invoice) {
        // Update existing invoice
        const { data, error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoice.id)
          .select()
          .single();

        if (error) throw error;
        invoiceId = data.id;

        // Delete existing items
        await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single();

        if (error) throw error;
        invoiceId = data.id;
      }

      // Insert invoice items
      const itemsToInsert = values.items.map((item) => ({
        invoice_id: invoiceId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
        time_entry_id: item.time_entry_id || null,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);

      if (itemsError) throw itemsError;

      onSuccess();
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issue_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date *</FormLabel>
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
          name="tax_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" max="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <FormLabel>Invoice Items *</FormLabel>
            {timeEntries.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Add from time entries:
                <select
                  className="ml-2 border rounded px-2 py-1"
                  onChange={(e) => {
                    const entry = timeEntries.find((te) => te.id === e.target.value);
                    if (entry) addTimeEntryAsItem(entry);
                    e.target.value = "";
                  }}
                >
                  <option value="">Select time entry...</option>
                  {timeEntries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {new Date(entry.date).toLocaleDateString()} - {entry.hours}h -{" "}
                      {entry.description || "No description"}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: "", quantity: 1, unit_price: 0, time_entry_id: "" })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 mb-2 items-end">
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem className="col-span-5">
                    <FormControl>
                      <Input placeholder="Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Qty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.unit_price`}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="col-span-2 text-right font-medium">
                €
                {(
                  (form.watch(`items.${index}.quantity`) || 0) *
                  (form.watch(`items.${index}.unit_price`) || 0)
                ).toFixed(2)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="col-span-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              No items yet. Click "Add Item" to add invoice items.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <div className="text-right space-y-1">
              <div className="flex justify-between gap-8">
                <span>Subtotal:</span>
                <span>
                  €
                  {calculateInvoiceTotals(
                    form.watch("items"),
                    form.watch("tax_rate"),
                  ).subtotal.toFixed(2)}
                </span>
              </div>
              {form.watch("tax_rate") > 0 && (
                <div className="flex justify-between gap-8">
                  <span>Tax ({form.watch("tax_rate")}%):</span>
                  <span>
                    €
                    {calculateInvoiceTotals(
                      form.watch("items"),
                      form.watch("tax_rate"),
                    ).taxAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-8 font-bold text-lg">
                <span>Total:</span>
                <span>
                  €
                  {calculateInvoiceTotals(
                    form.watch("items"),
                    form.watch("tax_rate"),
                  ).total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes..." {...field} />
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
            {loading ? "Saving..." : invoice ? "Update" : "Create"} Invoice
          </Button>
        </div>
      </form>
    </Form>
  );
}
