import { getStripeInvoice } from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local invoice
    const { data: localInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (invoiceError || !localInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If invoice has Stripe ID, fetch Stripe data
    if (localInvoice.stripe_invoice_id) {
      const stripeResult = await getStripeInvoice(localInvoice.stripe_invoice_id);
      if (stripeResult.success && stripeResult.invoice) {
        const stripe = stripeResult.invoice;
        return NextResponse.json({
          ...localInvoice,
          stripeHostedInvoiceUrl: stripe.hosted_invoice_url,
          stripeIssueDate: stripe.created
            ? new Date(stripe.created * 1000).toISOString().split("T")[0]
            : null,
          stripeDueDate: stripe.due_date
            ? new Date(stripe.due_date * 1000).toISOString().split("T")[0]
            : null,
          stripeSubtotal: stripe.subtotal ? stripe.subtotal / 100 : null,
          stripeTaxAmount: stripe.tax ? stripe.tax / 100 : null,
          stripeTotal: stripe.total ? stripe.total / 100 : null,
          stripeLineItems: stripe.lines.data.map((line) => ({
            description: line.description,
            quantity: line.quantity || 1,
            unit_price: line.price?.unit_amount ? line.price.unit_amount / 100 : 0,
            total: line.amount ? line.amount / 100 : 0,
          })),
          status:
            stripe.status === "paid"
              ? "paid"
              : stripe.status === "open"
                ? "sent"
                : stripe.status === "draft"
                  ? "draft"
                  : stripe.status === "void"
                    ? "cancelled"
                    : "overdue",
        });
      }
    }

    // Return local invoice data
    return NextResponse.json(localInvoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

