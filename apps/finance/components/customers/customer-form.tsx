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
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Customer } from "./customers-list";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  notes: z.string().optional(),
  tva_number: z.string().optional(),
  business_address: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  hourly_rate: z
    .string()
    .optional()
    .transform((val) => (val === "" ? null : val ? Number.parseFloat(val) : null)),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer: Customer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      notes: "",
      tva_number: "",
      business_address: "",
      phone_number: "",
      email: "",
      hourly_rate: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        notes: customer.notes || "",
        tva_number: customer.tva_number || "",
        business_address: customer.business_address || "",
        phone_number: customer.phone_number || "",
        email: customer.email || "",
        hourly_rate: customer.hourly_rate?.toString() || "",
      });
    }
  }, [customer, form]);

  async function onSubmit(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const customerData = {
        ...values,
        user_id: user.id,
        email: values.email || null,
        notes: values.notes || null,
        tva_number: values.tva_number || null,
        business_address: values.business_address || null,
        phone_number: values.phone_number || null,
        hourly_rate: values.hourly_rate || null,
      };

      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customer.id);

        if (error) throw error;
      } else {
        // Create new customer
        const { error } = await supabase.from("customers").insert([customerData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Failed to save customer. Please try again.");
    } finally {
      setIsSubmitting(false);
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
              <FormLabel>Customer Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter customer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="customer@example.com" {...field} />
              </FormControl>
              <FormDescription>Customer email address</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+32 123 456 789" {...field} />
              </FormControl>
              <FormDescription>Contact phone number</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tva_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TVA Number</FormLabel>
              <FormControl>
                <Input placeholder="BE0123456789" {...field} />
              </FormControl>
              <FormDescription>VAT/TVA number for invoicing</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="business_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Address</FormLabel>
              <FormControl>
                <Input placeholder="Street, City, Postal Code, Country" {...field} />
              </FormControl>
              <FormDescription>Full business address for invoices</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hourly_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="75.00" {...field} />
              </FormControl>
              <FormDescription>Default hourly rate for this customer</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this customer" rows={4} {...field} />
              </FormControl>
              <FormDescription>Any additional information</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
