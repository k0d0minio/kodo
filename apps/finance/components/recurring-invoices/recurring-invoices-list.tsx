"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateInvoiceFromRecurring } from "@/lib/recurring-invoices";
import { createClient } from "@/lib/supabase/client";
import { Edit, Play, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { RecurringInvoiceForm } from "./recurring-invoice-form";

export interface RecurringInvoice {
  id: string;
  name: string;
  customer_id: string;
  project_id: string | null;
  frequency: "monthly" | "quarterly" | "yearly";
  next_invoice_date: string;
  last_invoice_date: string | null;
  amount: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  customers: {
    name: string;
  };
}

export function RecurringInvoicesList() {
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecurringInvoice, setEditingRecurringInvoice] = useState<RecurringInvoice | null>(
    null,
  );
  const [deletingRecurringInvoice, setDeletingRecurringInvoice] = useState<RecurringInvoice | null>(
    null,
  );
  const [generating, setGenerating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRecurringInvoices();
  }, []);

  async function loadRecurringInvoices() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select(`
          *,
          customers:customer_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecurringInvoices(data || []);
    } catch (error) {
      console.error("Error loading recurring invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(recurringInvoice: RecurringInvoice) {
    if (!confirm(`Are you sure you want to delete "${recurringInvoice.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("recurring_invoices")
        .delete()
        .eq("id", recurringInvoice.id);

      if (error) throw error;
      await loadRecurringInvoices();
      setDeletingRecurringInvoice(null);
    } catch (error) {
      console.error("Error deleting recurring invoice:", error);
      alert("Failed to delete recurring invoice");
    }
  }

  async function handleGenerate(recurringInvoice: RecurringInvoice) {
    setGenerating(recurringInvoice.id);
    try {
      await generateInvoiceFromRecurring(recurringInvoice.id);
      await loadRecurringInvoices();
      alert("Invoice generated successfully!");
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    } finally {
      setGenerating(null);
    }
  }

  function handleEdit(recurringInvoice: RecurringInvoice) {
    setEditingRecurringInvoice(recurringInvoice);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingRecurringInvoice(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingRecurringInvoice(null);
    loadRecurringInvoices();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading recurring invoices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recurring Invoices</CardTitle>
              <CardDescription>Automatically generate invoices on a schedule</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Recurring Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recurringInvoices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No recurring invoices yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Recurring Invoice
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringInvoices.map((recurringInvoice) => (
                    <TableRow key={recurringInvoice.id}>
                      <TableCell className="font-medium">{recurringInvoice.name}</TableCell>
                      <TableCell>{recurringInvoice.customers.name}</TableCell>
                      <TableCell className="capitalize">{recurringInvoice.frequency}</TableCell>
                      <TableCell>
                        {new Date(recurringInvoice.next_invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        €
                        {recurringInvoice.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            recurringInvoice.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {recurringInvoice.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGenerate(recurringInvoice)}
                            disabled={
                              generating === recurringInvoice.id || !recurringInvoice.active
                            }
                            title="Generate invoice now"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(recurringInvoice)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingRecurringInvoice(recurringInvoice)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecurringInvoice ? "Edit Recurring Invoice" : "Create Recurring Invoice"}
            </DialogTitle>
            <DialogDescription>
              {editingRecurringInvoice
                ? "Update recurring invoice settings"
                : "Create a template for automatically generating invoices"}
            </DialogDescription>
          </DialogHeader>
          <RecurringInvoiceForm
            recurringInvoice={editingRecurringInvoice || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingRecurringInvoice(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deletingRecurringInvoice}
        onOpenChange={(open) => !open && setDeletingRecurringInvoice(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingRecurringInvoice?.name}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingRecurringInvoice(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingRecurringInvoice && handleDelete(deletingRecurringInvoice)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
