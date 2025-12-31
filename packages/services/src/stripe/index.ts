// Configuration
export {
  getStripeConfig,
  setStripeConfig,
  resetStripeConfig,
} from "./config.js";
export type { StripeConfig } from "./config.js";

// Client
export { getStripeClient, getStripePromise } from "./client.js";

// Checkout
export { createCheckoutSession } from "./checkout.js";
export type {
  CreateCheckoutSessionOptions,
  CreateCheckoutSessionResult,
} from "./checkout.js";

// Customers
export {
  createStripeCustomer,
  getStripeCustomer,
  updateStripeCustomer,
  listStripeCustomers,
  deleteStripeCustomer,
} from "./customers.js";
export type {
  CreateStripeCustomerOptions,
  UpdateStripeCustomerOptions,
  StripeCustomerResult,
} from "./customers.js";

// Invoices
export {
  createStripeInvoice,
  getStripeInvoice,
  finalizeStripeInvoice,
  sendStripeInvoice,
  listStripeInvoices,
  updateStripeInvoice,
  voidStripeInvoice,
} from "./invoices.js";
export type {
  CreateStripeInvoiceOptions,
  StripeInvoiceResult,
} from "./invoices.js";

// Subscriptions
export {
  createStripeSubscription,
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  listStripeSubscriptions,
} from "./subscriptions.js";
export type {
  CreateStripeSubscriptionOptions,
  UpdateStripeSubscriptionOptions,
  StripeSubscriptionResult,
} from "./subscriptions.js";

// Webhooks
export {
  constructWebhookEvent,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "./webhooks.js";
export type { WebhookEventResult } from "./webhooks.js";

