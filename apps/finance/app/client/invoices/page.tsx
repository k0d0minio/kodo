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
import { type ClientSession, getClientSession } from "@/lib/client-auth";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string;
  total: number;
  payment_link_token: string | null;
}

export default function ClientInvoicesPage() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const clientSession = getClientSession();
    if (!clientSession) {
      router.push("/");
      return;
    }
    setSession(clientSession);
    loadInvoices(clientSession.customerId);
  }, [router]);

  async function loadInvoices(customerId: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          status,
          issue_date,
          due_date,
          total,
          payment_link_token
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPDF(invoice: InvoiceListItem) {
    try {
      // Fetch full invoice data
      const { data: fullInvoice, error } = await supabase
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
        .eq("id", invoice.id)
        .single();

      if (error || !fullInvoice) {
        alert("Failed to load invoice data");
        return;
      }

      const invoiceData = {
        invoice_number: fullInvoice.invoice_number,
        issue_date: fullInvoice.issue_date,
        due_date: fullInvoice.due_date,
        customer: fullInvoice.customers,
        items: fullInvoice.invoice_items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        subtotal: fullInvoice.subtotal,
        tax_rate: fullInvoice.tax_rate,
        tax_amount: fullInvoice.tax_amount,
        total: fullInvoice.total,
        notes: fullInvoice.notes,
      };

      const blob = await generateInvoicePDF(invoiceData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${fullInvoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  }

  function handleLogout() {
    localStorage.removeItem("client_session");
    router.push("/");
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading invoices...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/client/portal">
              <Button variant="ghost" size="icon">
                ←
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My Invoices</h1>
              <p className="text-sm text-muted-foreground">{session.customerName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
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
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(invoice.status)}`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €
                          {invoice.total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {invoice.payment_link_token && (
                              <Link href={`/pay/${invoice.payment_link_token}`}>
                                <Button variant="outline" size="sm">
                                  Pay
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadPDF(invoice)}
                            >
                              <Download className="h-4 w-4" />
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
      </div>
    </div>
  );
}
