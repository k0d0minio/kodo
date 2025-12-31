import Stripe from "stripe";
import { getStripeClient } from "./client.js";
import { getStripeConfig } from "./config.js";

export interface WebhookEventResult {
  success: boolean;
  event?: Stripe.Event;
  error?: string;
}

/**
 * Verify and construct a Stripe webhook event from the request
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const config = getStripeConfig();
  if (!config.secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required for webhook verification");
  }

  const stripe = new Stripe(config.secretKey, {
    apiVersion: "2025-03-31.basil" as any,
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Handle invoice.paid webhook event
 */
export async function handleInvoicePaid(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    // This will be handled by the webhook route to update local database
    return {
      success: true,
      event,
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
 * Handle invoice.payment_failed webhook event
 */
export async function handleInvoicePaymentFailed(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  try {
    const invoice = event.data.object as Stripe.Invoice;
    // This will be handled by the webhook route to update local database
    return {
      success: true,
      event,
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
 * Handle customer.subscription.created webhook event
 */
export async function handleSubscriptionCreated(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    // This will be handled by the webhook route to update local database
    return {
      success: true,
      event,
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
 * Handle customer.subscription.updated webhook event
 */
export async function handleSubscriptionUpdated(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    // This will be handled by the webhook route to update local database
    return {
      success: true,
      event,
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
 * Handle customer.subscription.deleted webhook event
 */
export async function handleSubscriptionDeleted(
  event: Stripe.Event,
): Promise<WebhookEventResult> {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    // This will be handled by the webhook route to update local database
    return {
      success: true,
      event,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

