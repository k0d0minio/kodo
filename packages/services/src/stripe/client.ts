import Stripe from "stripe";
import { loadStripe, type Stripe as StripeType } from "@stripe/stripe-js";
import { getStripeConfig } from "./config.js";

let stripeInstance: Stripe | null = null;

/**
 * Get or create server-side Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const config = getStripeConfig();
  if (!config.secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Please set it in your environment variables. This is required for server-side Stripe operations.",
    );
  }

  stripeInstance = new Stripe(config.secretKey, {
    apiVersion: "2025-03-31.basil" as any, // Updated to support custom ui_mode (type assertion needed for newer API version)
  });
  return stripeInstance;
}

/**
 * Get client-side Stripe promise (for use with React Stripe.js)
 * This should be called outside of component render to avoid recreating the promise
 */
export function getStripePromise(): Promise<StripeType | null> {
  const config = getStripeConfig();
  return loadStripe(config.publishableKey);
}

