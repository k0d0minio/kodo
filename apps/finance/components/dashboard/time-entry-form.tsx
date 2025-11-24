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
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const timeEntrySchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  project_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

interface Customer {
  id: string;
  name: string;
  hourly_rate: number | null;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
}

interface TimeEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  mode?: "start" | "manual";
  initialValues?: {
    id?: string;
    customer_id?: string;
    project_id?: string;
    date?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
  };
}

export function TimeEntryForm({
  onSuccess,
  onCancel,
  mode = "manual",
  initialValues,
}: TimeEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const supabase = createClient();

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      customer_id: initialValues?.customer_id || "",
      project_id: initialValues?.project_id || "__none__",
      description: initialValues?.description || "",
      date: initialValues?.date || new Date().toISOString().split("T")[0],
    },
  });

  const selectedCustomerId = form.watch("customer_id");

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadProjects(selectedCustomerId);
    } else {
      setProjects([]);
      form.setValue("project_id", "__none__");
    }
  }, [selectedCustomerId]);

  async function loadCustomers() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("customers")
        .select("id, name, hourly_rate")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  }

  async function loadProjects(customerId: string) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, customer_id")
        .eq("customer_id", customerId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  async function onSubmit(values: TimeEntryFormValues) {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      if (initialValues?.id) {
        // Update existing entry
        const updateData: any = {
          customer_id: values.customer_id,
          project_id: values.project_id === "__none__" ? null : values.project_id || null,
          date: values.date,
          description: values.description || null,
        };

        // Only update times if they were provided
        if (initialValues.start_time) {
          updateData.start_time = initialValues.start_time;
        }
        if (initialValues.end_time) {
          updateData.end_time = initialValues.end_time;
        }

        const { error } = await supabase
          .from("time_entries")
          .update(updateData)
          .eq("id", initialValues.id);

        if (error) throw error;
      } else {
        // Create new entry
        const date = new Date(values.date);
        const startTime =
          mode === "start"
            ? new Date().toISOString()
            : initialValues?.start_time || new Date(date.setHours(9, 0, 0)).toISOString();

        const timeEntryData = {
          user_id: user.id,
          customer_id: values.customer_id,
          project_id: values.project_id === "__none__" ? null : values.project_id || null,
          date: values.date,
          start_time: startTime,
          end_time:
            mode === "start"
              ? null
              : initialValues?.end_time || new Date(date.setHours(17, 0, 0)).toISOString(),
          description: values.description || null,
          status: mode === "start" ? ("in_progress" as const) : ("completed" as const),
        };

        const { error } = await supabase.from("time_entries").insert([timeEntryData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving time entry:", error);
      alert("Failed to save time entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground mb-4">
          No customers found. Please create a customer first.
        </p>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.hourly_rate && ` (€${customer.hourly_rate}/h)`}
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
                        selectedCustomerId ? "Select a project" : "Select customer first"
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
              <FormDescription>Optional: Link this time entry to a project</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                {mode === "start" ? "Date for this time entry" : "Date of work"}
              </FormDescription>
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
                <Textarea placeholder="What work did you do?" rows={3} {...field} />
              </FormControl>
              <FormDescription>Optional description of the work performed</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : initialValues?.id
                ? "Update Time Entry"
                : mode === "start"
                  ? "Start Timer"
                  : "Add Time Entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
