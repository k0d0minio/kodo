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
import { createClient } from "@/lib/supabase/client";
import { Download, Edit, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { InvoiceForm } from "./invoice-form";

export interface Invoice {
  id: string;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string | null;
  due_date: string | null;
  total: number | null;
  customer_id: string;
  stripe_invoice_id: string | null;
  customers: {
    name: string;
  };
  // Stripe data (fetched when available)
  stripeIssueDate?: string | null;
  stripeDueDate?: string | null;
  stripeTotal?: number | null;
}

export function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    try {
      setLoading(true);
      // Load local invoices
      const { data: localInvoices, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customers:customer_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch Stripe data for invoices with stripe_invoice_id via API
      const invoicesWithStripeData = await Promise.all(
        (localInvoices || []).map(async (invoice) => {
          if (invoice.stripe_invoice_id) {
            try {
              const response = await fetch(`/api/stripe/invoices/${invoice.id}`);
              if (response.ok) {
                const data = await response.json();
                return data;
              }
            } catch (error) {
              console.error(
                `Error fetching Stripe data for invoice ${invoice.id}:`,
                error,
              );
            }
          }
          // Return invoice with local data (for existing records without Stripe)
          return invoice;
        }),
      );

      setInvoices(invoicesWithStripeData);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(invoice: Invoice) {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", invoice.id);

      if (error) throw error;
      await loadInvoices();
      setDeletingInvoice(null);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  }

  function handleEdit(invoice: Invoice) {
    setEditingInvoice(invoice);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingInvoice(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingInvoice(null);
    loadInvoices();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  const totalPending = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + (inv.stripeTotal || inv.total || 0), 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage and generate invoices from tracked hours</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Pending Invoices</p>
            <p className="text-2xl font-bold">
              €
              {totalPending.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No invoices yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {invoice.invoice_number}
                          <FileText className="h-3 w-3" />
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customers.name}</TableCell>
                      <TableCell>
                        {invoice.stripeIssueDate || invoice.issue_date
                          ? new Date(
                              invoice.stripeIssueDate || invoice.issue_date!,
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {invoice.stripeDueDate || invoice.due_date
                          ? new Date(
                              invoice.stripeDueDate || invoice.due_date!,
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(invoice.status)}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €
                        {(invoice.stripeTotal || invoice.total || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingInvoice(invoice)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "Create New Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? "Update invoice information"
                : "Create a new invoice from time entries or manual entry"}
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            invoice={
              editingInvoice
                ? {
                    id: editingInvoice.id,
                    customer_id: editingInvoice.customer_id,
                    invoice_number: editingInvoice.invoice_number,
                    issue_date: editingInvoice.issue_date,
                    due_date: editingInvoice.due_date,
                    tax_rate: 0, // Will be loaded from invoice items
                  }
                : undefined
            }
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingInvoice(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingInvoice} onOpenChange={(open) => !open && setDeletingInvoice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {deletingInvoice?.invoice_number}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingInvoice(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingInvoice && handleDelete(deletingInvoice)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
