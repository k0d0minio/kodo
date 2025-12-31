"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { CreditCard, Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface InvoiceData {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number | null;
  notes: string | null;
  payment_link_token: string | null;
  stripe_invoice_id: string | null;
  customers: {
    name: string;
    email: string | null;
    business_address: string | null;
  };
  invoice_items: Array<{
    id: string;
    description: string | null;
    quantity: number | null;
    unit_price: number | null;
    total: number | null;
  }>;
  // Stripe data
  stripeHostedInvoiceUrl?: string | null;
  stripeIssueDate?: string | null;
  stripeDueDate?: string | null;
  stripeSubtotal?: number | null;
  stripeTaxAmount?: number | null;
  stripeTotal?: number | null;
  stripeLineItems?: Array<{
    description: string | null;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const supabase = createClient();

  const loadInvoice = useCallback(
    async (paymentToken: string) => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("invoices")
          .select(`
          *,
          customers:customer_id (
            name,
            email,
            business_address
          ),
          invoice_items (*)
        `)
          .eq("payment_link_token", paymentToken)
          .single();

        if (error) throw error;

        // If invoice has Stripe ID, fetch Stripe data via API
        if (data.stripe_invoice_id) {
          try {
            const response = await fetch(`/api/stripe/invoices/${data.id}`);
            if (response.ok) {
              const invoiceData = await response.json();
              setInvoice(invoiceData);
              return;
            }
          } catch (stripeError) {
            console.error("Error fetching Stripe invoice:", stripeError);
          }
        }

        // Fall back to local data
        setInvoice(data);
      } catch (error) {
        console.error("Error loading invoice:", error);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
      loadInvoice(p.token);
    });
  }, [params, loadInvoice]);

  async function handleDownloadPDF() {
    if (!invoice) return;

    setGeneratingPDF(true);
    try {
      // Use Stripe data if available, otherwise fall back to local data
      const invoiceData = {
        invoice_number: invoice.invoice_number,
        issue_date: invoice.stripeIssueDate || invoice.issue_date || new Date().toISOString().split("T")[0],
        due_date: invoice.stripeDueDate || invoice.due_date || new Date().toISOString().split("T")[0],
        customer: invoice.customers,
        items: invoice.stripeLineItems || invoice.invoice_items
          .filter((item) => item.description) // Only include items with descriptions
          .map((item) => ({
            description: item.description || "",
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total: item.total || 0,
          })),
        subtotal: invoice.stripeSubtotal || invoice.subtotal || 0,
        tax_rate: invoice.tax_rate || 0,
        tax_amount: invoice.stripeTaxAmount || invoice.tax_amount || 0,
        total: invoice.stripeTotal || invoice.total || 0,
        notes: invoice.notes,
      };

      const blob = await generateInvoicePDF(invoiceData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  }

  function handlePay() {
    if (invoice?.stripeHostedInvoiceUrl) {
      // Redirect to Stripe hosted invoice page
      window.location.href = invoice.stripeHostedInvoiceUrl;
    } else {
      alert(
        "Payment link not available. Please contact the invoice issuer to arrange payment.",
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading invoice...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Invoice not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
                <CardDescription>{invoice.customers.name}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownloadPDF} disabled={generatingPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  {generatingPDF ? "Generating..." : "Download PDF"}
                </Button>
                {!isPaid && (
                  <Button onClick={handlePay}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Invoice
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPaid && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center">
                <p className="text-green-800 dark:text-green-200 font-medium">
                  This invoice has been paid
                </p>
              </div>
            )}

            {isOverdue && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 text-center">
                <p className="text-red-800 dark:text-red-200 font-medium">
                  This invoice is overdue
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">
                  {invoice.stripeIssueDate || invoice.issue_date
                    ? format(
                        new Date(invoice.stripeIssueDate || invoice.issue_date!),
                        "MMM dd, yyyy",
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {invoice.stripeDueDate || invoice.due_date
                    ? format(
                        new Date(invoice.stripeDueDate || invoice.due_date!),
                        "MMM dd, yyyy",
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{invoice.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-medium text-lg">
                  €
                  {(invoice.stripeTotal || invoice.total || 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Items</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invoice.stripeLineItems || invoice.invoice_items.filter((item) => item.description)).map(
                      (item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.description || "-"}</TableCell>
                          <TableCell className="text-right">{item.quantity || 1}</TableCell>
                          <TableCell className="text-right">
                            €
                            {(item.unit_price || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            €
                            {(item.total || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    €
                    {(invoice.stripeSubtotal || invoice.subtotal || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {(invoice.stripeTaxAmount || invoice.tax_amount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({invoice.tax_rate || 0}%):</span>
                    <span>
                      €
                      {(invoice.stripeTaxAmount || invoice.tax_amount || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>
                    €
                    {(invoice.stripeTotal || invoice.total || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <p className="text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
