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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  customer_id: z.string().uuid("Please select a customer"),
  budget: z.coerce.number().positive().optional().or(z.literal("")),
  status: z.enum(["active", "completed", "archived"]),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().or(z.literal("")),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Customer {
  id: string;
  name: string;
}

interface ProjectFormProps {
  project?: {
    id: string;
    name: string;
    description?: string | null;
    customer_id: string;
    budget?: number | null;
    status: "active" | "completed" | "archived";
    start_date: string;
    end_date?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const supabase = createClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name || "",
      description: project?.description || "",
      customer_id: project?.customer_id || "",
      budget: project?.budget || "",
      status: project?.status || "active",
      start_date: project?.start_date || new Date().toISOString().split("T")[0],
      end_date: project?.end_date || "",
    },
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data, error } = await supabase.from("customers").select("id, name").order("name");

    if (error) {
      console.error("Error loading customers:", error);
    } else {
      setCustomers(data || []);
    }
  }

  async function onSubmit(values: ProjectFormValues) {
    setLoading(true);
    try {
      // Get current user for new projects
      let userId: string | undefined;
      if (!project) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        userId = user.id;
      }

      const projectData: any = {
        name: values.name,
        description: values.description || null,
        customer_id: values.customer_id,
        budget: values.budget && values.budget !== "" ? values.budget : null,
        status: values.status,
        start_date: values.start_date,
        end_date: values.end_date && values.end_date !== "" ? values.end_date : null,
      };

      // Only include user_id when creating a new project
      if (!project && userId) {
        projectData.user_id = userId;
      }

      let error;
      if (project) {
        // Update existing project
        const result = await supabase.from("projects").update(projectData).eq("id", project.id);

        error = result.error;
      } else {
        // Create new project
        const result = await supabase.from("projects").insert(projectData);

        error = result.error;
      }

      if (error) {
        console.error("Error saving project:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        alert(`Failed to save project: ${error.message || "Unknown error"}`);
        return;
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error saving project:", {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`Failed to save project: ${errorMessage}`);
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
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Website Redesign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Project description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date (Optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (€) (Optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : project ? "Update" : "Create"} Project
          </Button>
        </div>
      </form>
    </Form>
  );
}
