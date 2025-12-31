export interface StripeConfig {
  publishableKey: string;
  secretKey?: string;
}

let config: StripeConfig | null = null;

/**
 * Get Stripe configuration from environment variables
 * Supports both client-side (NEXT_PUBLIC_*) and server-side usage
 */
export function getStripeConfig(): StripeConfig {
  if (config) {
    return config;
  }

  // Check for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY first (client-safe)
  // Fall back to STRIPE_PUBLISHABLE_KEY for server-side usage
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      "STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Please set it in your environment variables.",
    );
  }

  // Secret key is optional (only needed for server-side operations)
  const secretKey = process.env.STRIPE_SECRET_KEY;

  config = {
    publishableKey,
    ...(secretKey && { secretKey }),
  };

  return config;
}

/**
 * Set Stripe configuration programmatically (useful for testing)
 */
export function setStripeConfig(newConfig: StripeConfig): void {
  config = newConfig;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetStripeConfig(): void {
  config = null;
}

