import { createStripeInvoice } from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, invoiceNumber, issueDate, dueDate, taxRate, items, notes, projectId } =
      body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get customer's Stripe ID
    const { data: localCustomer, error: customerError } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", customerId)
      .eq("user_id", user.id)
      .single();

    if (customerError || !localCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (!localCustomer.stripe_customer_id) {
      return NextResponse.json(
        { error: "Customer does not have a Stripe ID. Please ensure the customer is synced with Stripe." },
        { status: 400 },
      );
    }

    // Calculate due date as Unix timestamp
    const dueDateTimestamp = Math.floor(new Date(dueDate).getTime() / 1000);

    // Prepare line items for Stripe
    const lineItems = items.map((item: { description: string; quantity: number; unit_price: number }) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: Math.round(item.unit_price * 100), // Convert to cents
    }));

    // Create invoice in Stripe
    const stripeResult = await createStripeInvoice({
      customerId: localCustomer.stripe_customer_id,
      description: notes || undefined,
      dueDate: dueDateTimestamp,
      lineItems,
      autoAdvance: false,
      collectionMethod: "send_invoice",
      metadata: {
        local_customer_id: customerId,
        ...(projectId && { local_project_id: projectId }),
      },
    });

    if (!stripeResult.success || !stripeResult.invoice) {
      return NextResponse.json(
        { error: stripeResult.error || "Failed to create invoice in Stripe" },
        { status: 500 },
      );
    }

    // Store minimal data locally
    const { data: localInvoice, error: dbError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        customer_id: customerId,
        project_id: projectId || null,
        invoice_number: invoiceNumber,
        stripe_invoice_id: stripeResult.invoice.id,
        status: stripeResult.invoice.status === "draft" ? "draft" : "sent",
        issue_date: null,
        due_date: null,
        subtotal: null,
        tax_rate: null,
        tax_amount: null,
        total: null,
        notes: null,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Store minimal invoice items for local reference (relationships with time entries)
    const itemsToInsert = items.map((item: { time_entry_id?: string }) => ({
      invoice_id: localInvoice.id,
      description: null,
      quantity: null,
      unit_price: null,
      total: null,
      time_entry_id: item.time_entry_id || null,
    }));

    await supabase.from("invoice_items").insert(itemsToInsert);

    return NextResponse.json({
      success: true,
      invoice: localInvoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

