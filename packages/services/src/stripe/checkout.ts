import Stripe from "stripe";
import { getStripeClient } from "./client.js";

export interface CreateCheckoutSessionOptions {
  amount: number; // Amount in cents
  currency?: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
  description?: string;
  mode?: "payment" | "subscription" | "setup";
  lineItems?: Stripe.Checkout.SessionCreateParams.LineItem[];
  returnUrl: string; // Required for embedded checkout mode
}

export interface CreateCheckoutSessionResult {
  success: boolean;
  clientSecret?: string;
  sessionId?: string;
  url?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions,
): Promise<CreateCheckoutSessionResult> {
  try {
    const stripe = getStripeClient();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: options.mode || "payment",
      ui_mode: "custom" as Stripe.Checkout.SessionCreateParams.UiMode, // Changed from "embedded" to "custom" for CheckoutProvider
      return_url: options.returnUrl, // Required for custom mode
      metadata: options.metadata || {},
    };

    // If line items are provided, use them; otherwise create from amount
    if (options.lineItems && options.lineItems.length > 0) {
      sessionParams.line_items = options.lineItems;
    } else {
      sessionParams.line_items = [
        {
          price_data: {
            currency: options.currency || "usd",
            product_data: {
              name: options.description || "Payment",
            },
            unit_amount: options.amount,
          },
          quantity: 1,
        },
      ];
    }

    if (options.customerEmail) {
      sessionParams.customer_email = options.customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      success: true,
      clientSecret: session.client_secret || undefined,
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

