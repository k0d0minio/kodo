import { createClient } from "@/lib/supabase/client";
import { addMonths, addQuarters, addYears } from "date-fns";
import { generateInvoiceNumber, generatePaymentLinkToken } from "./invoices";

/**
 * Generate an invoice from a recurring invoice template
 */
export async function generateInvoiceFromRecurring(recurringInvoiceId: string): Promise<string> {
  const supabase = createClient();

  // Get the recurring invoice
  const { data: recurringInvoice, error: fetchError } = await supabase
    .from("recurring_invoices")
    .select("*")
    .eq("id", recurringInvoiceId)
    .single();

  if (fetchError || !recurringInvoice) {
    throw new Error("Recurring invoice not found");
  }

  if (!recurringInvoice.active) {
    throw new Error("Recurring invoice is not active");
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Calculate next invoice date
  const currentDate = new Date(recurringInvoice.next_invoice_date);
  let nextDate: Date;

  switch (recurringInvoice.frequency) {
    case "monthly":
      nextDate = addMonths(currentDate, 1);
      break;
    case "quarterly":
      nextDate = addQuarters(currentDate, 1);
      break;
    case "yearly":
      nextDate = addYears(currentDate, 1);
      break;
    default:
      nextDate = currentDate;
  }

  // Create the invoice
  const issueDate = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      customer_id: recurringInvoice.customer_id,
      project_id: recurringInvoice.project_id,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate,
      subtotal: recurringInvoice.amount,
      tax_rate: 0,
      tax_amount: 0,
      total: recurringInvoice.amount,
      notes: recurringInvoice.description,
      payment_link_token: generatePaymentLinkToken(),
      status: "draft",
    })
    .select()
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  // Create invoice item
  const { error: itemError } = await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description: recurringInvoice.description || recurringInvoice.name,
    quantity: 1,
    unit_price: recurringInvoice.amount,
    total: recurringInvoice.amount,
  });

  if (itemError) {
    throw itemError;
  }

  // Update recurring invoice
  const { error: updateError } = await supabase
    .from("recurring_invoices")
    .update({
      last_invoice_date: issueDate,
      next_invoice_date: nextDate.toISOString().split("T")[0],
    })
    .eq("id", recurringInvoiceId);

  if (updateError) {
    throw updateError;
  }

  return invoice.id;
}

/**
 * Generate invoices for all recurring invoices that are due
 * This should be called by a cron job or scheduled task
 */
export async function generateDueRecurringInvoices(): Promise<number> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get all active recurring invoices that are due
  const { data: dueRecurringInvoices, error } = await supabase
    .from("recurring_invoices")
    .select("*")
    .eq("active", true)
    .lte("next_invoice_date", today);

  if (error) {
    throw error;
  }

  if (!dueRecurringInvoices || dueRecurringInvoices.length === 0) {
    return 0;
  }

  let generatedCount = 0;

  for (const recurringInvoice of dueRecurringInvoices) {
    try {
      await generateInvoiceFromRecurring(recurringInvoice.id);
      generatedCount++;
    } catch (error) {
      console.error(
        `Error generating invoice for recurring invoice ${recurringInvoice.id}:`,
        error,
      );
    }
  }

  return generatedCount;
}
