import Stripe from "stripe";
import { getStripeClient } from "./client.js";

export interface CreateStripeCustomerOptions {
  email?: string;
  name: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
}

export interface UpdateStripeCustomerOptions {
  email?: string;
  name?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
}

export interface StripeCustomerResult {
  success: boolean;
  customer?: Stripe.Customer;
  error?: string;
}

/**
 * Create a customer in Stripe
 */
export async function createStripeCustomer(
  options: CreateStripeCustomerOptions,
): Promise<StripeCustomerResult> {
  try {
    const stripe = getStripeClient();

    const customerParams: Stripe.CustomerCreateParams = {
      name: options.name,
      ...(options.email && { email: options.email }),
      ...(options.phone && { phone: options.phone }),
      ...(options.address && { address: options.address }),
      ...(options.metadata && { metadata: options.metadata }),
    };

    const customer = await stripe.customers.create(customerParams);

    return {
      success: true,
      customer,
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
 * Retrieve a customer from Stripe by ID
 */
export async function getStripeCustomer(
  customerId: string,
): Promise<StripeCustomerResult> {
  try {
    const stripe = getStripeClient();
    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return {
        success: false,
        error: "Customer has been deleted",
      };
    }

    return {
      success: true,
      customer: customer as Stripe.Customer,
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
 * Update a customer in Stripe
 */
export async function updateStripeCustomer(
  customerId: string,
  options: UpdateStripeCustomerOptions,
): Promise<StripeCustomerResult> {
  try {
    const stripe = getStripeClient();

    const updateParams: Stripe.CustomerUpdateParams = {};
    if (options.email !== undefined) updateParams.email = options.email;
    if (options.name !== undefined) updateParams.name = options.name;
    if (options.phone !== undefined) updateParams.phone = options.phone;
    if (options.address !== undefined) updateParams.address = options.address;
    if (options.metadata !== undefined) updateParams.metadata = options.metadata;

    const customer = await stripe.customers.update(customerId, updateParams);

    return {
      success: true,
      customer,
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
 * List customers from Stripe
 */
export async function listStripeCustomers(
  options?: {
    limit?: number;
    starting_after?: string;
    ending_before?: string;
    email?: string;
  },
): Promise<{
  success: boolean;
  customers?: Stripe.Customer[];
  has_more?: boolean;
  error?: string;
}> {
  try {
    const stripe = getStripeClient();

    const listParams: Stripe.CustomerListParams = {
      limit: options?.limit || 10,
      ...(options?.starting_after && { starting_after: options.starting_after }),
      ...(options?.ending_before && { ending_before: options.ending_before }),
      ...(options?.email && { email: options.email }),
    };

    const customers = await stripe.customers.list(listParams);

    return {
      success: true,
      customers: customers.data,
      has_more: customers.has_more,
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
 * Delete a customer in Stripe
 */
export async function deleteStripeCustomer(
  customerId: string,
): Promise<StripeCustomerResult> {
  try {
    const stripe = getStripeClient();
    const deletedCustomer = await stripe.customers.del(customerId);

    // Deleted customer has a different structure, but we can still return it
    // The customer property contains the customer data before deletion
    return {
      success: true,
      customer: deletedCustomer as unknown as Stripe.Customer,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

