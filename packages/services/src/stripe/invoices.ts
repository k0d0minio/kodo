import Stripe from "stripe";
import { getStripeClient } from "./client.js";

export interface CreateStripeInvoiceOptions {
  customerId: string;
  description?: string;
  dueDate?: number; // Unix timestamp
  metadata?: Record<string, string>;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number; // Amount in cents
    taxRates?: string[]; // Tax rate IDs
  }>;
  autoAdvance?: boolean; // Automatically finalize invoice
  collectionMethod?: "charge_automatically" | "send_invoice";
  daysUntilDue?: number;
}

export interface StripeInvoiceResult {
  success: boolean;
  invoice?: Stripe.Invoice;
  error?: string;
}

/**
 * Create an invoice in Stripe
 */
export async function createStripeInvoice(
  options: CreateStripeInvoiceOptions,
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();

    // Create invoice
    const invoiceParams: Stripe.InvoiceCreateParams = {
      customer: options.customerId,
      ...(options.description && { description: options.description }),
      ...(options.dueDate && { due_date: options.dueDate }),
      ...(options.metadata && { metadata: options.metadata }),
      auto_advance: options.autoAdvance ?? false,
      collection_method:
        options.collectionMethod || "send_invoice",
      ...(options.daysUntilDue && { days_until_due: options.daysUntilDue }),
    };

    const invoice = await stripe.invoices.create(invoiceParams);

    // Add line items
    for (const item of options.lineItems) {
      await stripe.invoiceItems.create({
        customer: options.customerId,
        invoice: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_amount: item.unitAmount,
        ...(item.taxRates && item.taxRates.length > 0 && { tax_rates: item.taxRates }),
      });
    }

    // Finalize invoice if auto_advance is true
    if (options.autoAdvance) {
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      return {
        success: true,
        invoice: finalizedInvoice,
      };
    }

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Retrieve an invoice from Stripe by ID
 */
export async function getStripeInvoice(
  invoiceId: string,
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.retrieve(invoiceId);

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Finalize an invoice in Stripe
 */
export async function finalizeStripeInvoice(
  invoiceId: string,
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.finalizeInvoice(invoiceId);

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send an invoice to the customer
 */
export async function sendStripeInvoice(
  invoiceId: string,
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.sendInvoice(invoiceId);

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * List invoices from Stripe
 */
export async function listStripeInvoices(
  options?: {
    customerId?: string;
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    status?: "draft" | "open" | "paid" | "uncollectible" | "void";
  },
): Promise<{
  success: boolean;
  invoices?: Stripe.Invoice[];
  has_more?: boolean;
  error?: string;
}> {
  try {
    const stripe = getStripeClient();

    const listParams: Stripe.InvoiceListParams = {
      limit: options?.limit || 10,
      ...(options?.customerId && { customer: options.customerId }),
      ...(options?.starting_after && { starting_after: options.starting_after }),
      ...(options?.ending_before && { ending_before: options.ending_before }),
      ...(options?.status && { status: options.status }),
    };

    const invoices = await stripe.invoices.list(listParams);

    return {
      success: true,
      invoices: invoices.data,
      has_more: invoices.has_more,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update an invoice in Stripe
 */
export async function updateStripeInvoice(
  invoiceId: string,
  options: {
    description?: string;
    dueDate?: number;
    metadata?: Record<string, string>;
    daysUntilDue?: number;
  },
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();

    const updateParams: Stripe.InvoiceUpdateParams = {};
    if (options.description !== undefined)
      updateParams.description = options.description;
    if (options.dueDate !== undefined) updateParams.due_date = options.dueDate;
    if (options.metadata !== undefined) updateParams.metadata = options.metadata;
    if (options.daysUntilDue !== undefined)
      updateParams.days_until_due = options.daysUntilDue;

    const invoice = await stripe.invoices.update(invoiceId, updateParams);

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Void an invoice in Stripe
 */
export async function voidStripeInvoice(
  invoiceId: string,
): Promise<StripeInvoiceResult> {
  try {
    const stripe = getStripeClient();
    const invoice = await stripe.invoices.voidInvoice(invoiceId);

    return {
      success: true,
      invoice,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

