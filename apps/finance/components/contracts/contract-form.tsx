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
import { uploadContractFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const contractSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customer_id: z.string().uuid("Please select a customer"),
  project_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().or(z.literal("")),
  renewal_date: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "expired", "terminated"]),
  contract_file: z.instanceof(File).optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  customer_id: string;
}

interface ContractFormProps {
  contract?: {
    id: string;
    title: string;
    customer_id: string;
    project_id?: string | null;
    description?: string | null;
    start_date: string;
    end_date?: string | null;
    renewal_date?: string | null;
    status: "active" | "expired" | "terminated";
    contract_url?: string | null;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContractForm({ contract, onSuccess, onCancel }: ContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const supabase = createClient();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: contract?.title || "",
      customer_id: contract?.customer_id || "",
      project_id: contract?.project_id || "__none__",
      description: contract?.description || "",
      start_date: contract?.start_date || new Date().toISOString().split("T")[0],
      end_date: contract?.end_date || "",
      renewal_date: contract?.renewal_date || "",
      status: contract?.status || "active",
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
      .order("name");

    if (error) {
      console.error("Error loading projects:", error);
    } else {
      setProjects(data || []);
    }
  }

  async function onSubmit(values: ContractFormValues) {
    setLoading(true);
    try {
      let contractUrl = contract?.contract_url || null;

      // Upload file if provided
      if (file) {
        // If updating, we need the contract ID first
        if (contract) {
          contractUrl = await uploadContractFile(file, contract.id);
        } else {
          // For new contracts, we'll upload after creation
          // For now, we'll create the contract first, then upload
        }
      }

      const contractData = {
        title: values.title,
        customer_id: values.customer_id,
        project_id: values.project_id === "__none__" ? null : values.project_id || null,
        description: values.description || null,
        start_date: values.start_date,
        end_date: values.end_date || null,
        renewal_date: values.renewal_date || null,
        status: values.status,
        contract_url: contractUrl,
      };

      let contractId: string;

      if (contract) {
        // Update existing contract
        const { data: updatedContract, error } = await supabase
          .from("contracts")
          .update(contractData as never)
          .eq("id", contract.id)
          .select()
          .single();

        if (error) throw error;
        contractId = (updatedContract as { id: string }).id;
      } else {
        // Create new contract
        const { data: newContract, error } = await supabase
          .from("contracts")
          .insert(contractData as never)
          .select()
          .single();

        if (error) throw error;
        contractId = (newContract as { id: string }).id;

        // Upload file if provided for new contract
        if (file) {
          contractUrl = await uploadContractFile(file, contractId);
          await supabase
            .from("contracts")
            .update({ contract_url: contractUrl } as never)
            .eq("id", contractId);
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Failed to save contract. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contract Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Service Agreement 2024" {...field} />
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Contract description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
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

          <FormField
            control={form.control}
            name="renewal_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Renewal Date (Optional)</FormLabel>
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
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Contract File (Optional)</FormLabel>
          <FormControl>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                }
              }}
            />
          </FormControl>
          {contract?.contract_url && (
            <p className="text-sm text-muted-foreground">
              Current file:{" "}
              <a
                href={contract.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                View
              </a>
            </p>
          )}
        </FormItem>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : contract ? "Update" : "Create"} Contract
          </Button>
        </div>
      </form>
    </Form>
  );
}
