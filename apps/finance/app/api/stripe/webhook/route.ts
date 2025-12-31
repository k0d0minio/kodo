import { constructWebhookEvent } from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    // Verify and construct the webhook event
    const event = constructWebhookEvent(body, signature);

    const supabase = await createClient();

    // Handle different event types
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.id) {
          // Update invoice status in local database
          await supabase
            .from("invoices")
            .update({
              status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_invoice_id", invoice.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.id) {
          // Update invoice status in local database
          await supabase
            .from("invoices")
            .update({
              status: "overdue",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_invoice_id", invoice.id);
        }
        break;
      }

      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.id) {
          // Update invoice status to "sent" when finalized
          await supabase
            .from("invoices")
            .update({
              status: "sent",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_invoice_id", invoice.id);
        }
        break;
      }

      case "invoice.voided": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.id) {
          // Update invoice status to "cancelled" when voided
          await supabase
            .from("invoices")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_invoice_id", invoice.id);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.id) {
          // Update recurring_invoice with subscription ID and active status
          await supabase
            .from("recurring_invoices")
            .update({
              stripe_subscription_id: subscription.id,
              active: subscription.status === "active",
              updated_at: new Date().toISOString(),
            })
            .eq("customer_id", subscription.metadata?.local_customer_id || "");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.id) {
          // Update subscription status in local database
          await supabase
            .from("recurring_invoices")
            .update({
              active:
                subscription.status === "active" ||
                subscription.status === "trialing",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.id) {
          // Mark subscription as inactive in local database
          await supabase
            .from("recurring_invoices")
            .update({
              active: false,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

