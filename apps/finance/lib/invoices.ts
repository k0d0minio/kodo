import { createClient } from "@/lib/supabase/client";

/**
 * Generate a unique invoice number
 * Format: INV-YYYY-XXXX (e.g., INV-2024-0001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get the highest invoice number for this year
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching invoices:", error);
    // Fallback: use timestamp-based number
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }

  if (!invoices || invoices.length === 0) {
    return `${prefix}0001`;
  }

  // Extract the number part and increment
  const typedInvoices = invoices as Array<{ invoice_number: string }>;
  const lastNumber = typedInvoices[0].invoice_number.replace(prefix, "");
  const nextNumber = Number.parseInt(lastNumber, 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

/**
 * Generate a unique payment link token
 */
export function generatePaymentLinkToken(): string {
  // Generate a secure random token using crypto API (browser-compatible)
  const array = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate invoice totals from items
 */
export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  taxRate = 0,
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Get payment link URL for an invoice
 */
export function getPaymentLinkUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/pay/${token}`;
}
