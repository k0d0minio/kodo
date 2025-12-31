import Stripe from "stripe";
import { getStripeClient } from "./client.js";

export interface CreateStripeSubscriptionOptions {
  customerId: string;
  items: Array<{
    priceId?: string; // Use existing price ID
    priceData?: {
      // Create new price on the fly
      currency: string;
      unitAmount: number; // Amount in cents
      recurring: {
        interval: "day" | "week" | "month" | "year";
        intervalCount?: number;
      };
      productData?: {
        name: string;
        description?: string;
      };
    };
    quantity?: number;
  }>;
  metadata?: Record<string, string>;
  collectionMethod?: "charge_automatically" | "send_invoice";
  daysUntilDue?: number;
  trialPeriodDays?: number;
  billingCycleAnchor?: number; // Unix timestamp
}

export interface UpdateStripeSubscriptionOptions {
  items?: Array<{
    id?: string; // Subscription item ID for updates
    priceId?: string;
    quantity?: number;
    deleted?: boolean;
  }>;
  metadata?: Record<string, string>;
  collectionMethod?: "charge_automatically" | "send_invoice";
  daysUntilDue?: number;
  trialEnd?: number | "now"; // Unix timestamp or "now"
  cancelAtPeriodEnd?: boolean;
}

export interface StripeSubscriptionResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  error?: string;
}

/**
 * Create a subscription in Stripe
 */
export async function createStripeSubscription(
  options: CreateStripeSubscriptionOptions,
): Promise<StripeSubscriptionResult> {
  try {
    const stripe = getStripeClient();

    // Build subscription items
    const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] =
      options.items.map((item) => {
        if (item.priceId) {
          return {
            price: item.priceId,
            quantity: item.quantity || 1,
          };
        } else if (item.priceData) {
          // Use type assertion because Stripe API accepts product_data
          // even though TypeScript types require product
          return {
            price_data: {
              currency: item.priceData.currency,
              unit_amount: item.priceData.unitAmount,
              recurring: {
                interval: item.priceData.recurring.interval,
                ...(item.priceData.recurring.intervalCount && {
                  interval_count: item.priceData.recurring.intervalCount,
                }),
              },
              ...(item.priceData.productData && {
                product_data: {
                  name: item.priceData.productData.name,
                  ...(item.priceData.productData.description && {
                    description: item.priceData.productData.description,
                  }),
                },
              }),
            },
            quantity: item.quantity || 1,
          } as Stripe.SubscriptionCreateParams.Item;
        } else {
          throw new Error("Either priceId or priceData must be provided");
        }
      });

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: options.customerId,
      items: subscriptionItems,
      ...(options.metadata && { metadata: options.metadata }),
      collection_method: options.collectionMethod || "charge_automatically",
      ...(options.daysUntilDue && { days_until_due: options.daysUntilDue }),
      ...(options.trialPeriodDays && {
        trial_period_days: options.trialPeriodDays,
      }),
      ...(options.billingCycleAnchor && {
        billing_cycle_anchor: options.billingCycleAnchor,
      }),
    };

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    return {
      success: true,
      subscription,
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
 * Retrieve a subscription from Stripe by ID
 */
export async function getStripeSubscription(
  subscriptionId: string,
): Promise<StripeSubscriptionResult> {
  try {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return {
      success: true,
      subscription,
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
 * Update a subscription in Stripe
 */
export async function updateStripeSubscription(
  subscriptionId: string,
  options: UpdateStripeSubscriptionOptions,
): Promise<StripeSubscriptionResult> {
  try {
    const stripe = getStripeClient();

    const updateParams: Stripe.SubscriptionUpdateParams = {};
    if (options.items !== undefined) {
      updateParams.items = options.items.map((item) => {
        if (item.deleted) {
          return { id: item.id!, deleted: true };
        }
        return {
          ...(item.id && { id: item.id }),
          ...(item.priceId && { price: item.priceId }),
          ...(item.quantity !== undefined && { quantity: item.quantity }),
        };
      });
    }
    if (options.metadata !== undefined) updateParams.metadata = options.metadata;
    if (options.collectionMethod !== undefined)
      updateParams.collection_method = options.collectionMethod;
    if (options.daysUntilDue !== undefined)
      updateParams.days_until_due = options.daysUntilDue;
    if (options.trialEnd !== undefined) updateParams.trial_end = options.trialEnd;
    if (options.cancelAtPeriodEnd !== undefined)
      updateParams.cancel_at_period_end = options.cancelAtPeriodEnd;

    const subscription = await stripe.subscriptions.update(
      subscriptionId,
      updateParams,
    );

    return {
      success: true,
      subscription,
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
 * Cancel a subscription in Stripe
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelImmediately = false,
): Promise<StripeSubscriptionResult> {
  try {
    const stripe = getStripeClient();

    if (cancelImmediately) {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return {
        success: true,
        subscription,
      };
    } else {
      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return {
        success: true,
        subscription,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * List subscriptions from Stripe
 */
export async function listStripeSubscriptions(
  options?: {
    customerId?: string;
    status?: Stripe.Subscription.Status;
    limit?: number;
    starting_after?: string;
    ending_before?: string;
  },
): Promise<{
  success: boolean;
  subscriptions?: Stripe.Subscription[];
  has_more?: boolean;
  error?: string;
}> {
  try {
    const stripe = getStripeClient();

    const listParams: Stripe.SubscriptionListParams = {
      limit: options?.limit || 10,
      ...(options?.customerId && { customer: options.customerId }),
      ...(options?.status && { status: options.status }),
      ...(options?.starting_after && { starting_after: options.starting_after }),
      ...(options?.ending_before && { ending_before: options.ending_before }),
    };

    const subscriptions = await stripe.subscriptions.list(listParams);

    return {
      success: true,
      subscriptions: subscriptions.data,
      has_more: subscriptions.has_more,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

