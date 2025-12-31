"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStripePromise } from "@kodo/services/stripe";
import { CheckoutProvider, PaymentElement, useCheckout } from "@stripe/react-stripe-js/checkout";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = getStripePromise();

type PaymentStatus = "idle" | "loading" | "success" | "error" | "canceled";

function CheckoutForm() {
  const checkoutState = useCheckout();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    if (checkoutState.type === "loading") {
      setIsSubmitting(false);
      return;
    }

    if (checkoutState.type === "error") {
      setSubmitError(checkoutState.error.message);
      setIsSubmitting(false);
      return;
    }

    // checkoutState.type === 'success'
    const { checkout } = checkoutState;

    try {
      const result = await checkout.confirm();

      if (result.type === "error") {
        setSubmitError(result.error.message);
      }
      // If successful, customer will be redirected to return_url
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutState.type === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-2 text-sm text-muted-foreground">Loading payment form...</div>
        </div>
      </div>
    );
  }

  if (checkoutState.type === "error") {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
        <p className="font-semibold">Error loading checkout</p>
        <p className="mt-1">{checkoutState.error.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
      </div>

      {submitError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

function StripeTestPageContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as PaymentStatus | null;

  const [amount, setAmount] = useState("10.00");
  const [currency, setCurrency] = useState("usd");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("Test Payment");
  const [metadata, setMetadata] = useState("test=true");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    status || "idle",
  );

  const createCheckoutSession = async () => {
    setIsCreatingSession(true);
    setSessionError(null);
    setPaymentStatus("idle");

    try {
      const metadataObj: Record<string, string> = {};
      if (metadata) {
        metadata.split(",").forEach((pair) => {
          const [key, value] = pair.split("=").map((s) => s.trim());
          if (key && value) {
            metadataObj[key] = value;
          }
        });
      }

      // Get current page URL for return URL (embedded checkout)
      const returnUrl = `${window.location.origin}${window.location.pathname}?status=success`;

      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          customerEmail: customerEmail || undefined,
          description,
          metadata: metadataObj,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (!data.clientSecret) {
        throw new Error("No client secret returned from server");
      }

      setClientSecret(data.clientSecret);
      setPaymentStatus("loading");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setSessionError(errorMessage);
      setPaymentStatus("error");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const resetForm = () => {
    setClientSecret(null);
    setPaymentStatus("idle");
    setSessionError(null);
  };

  // Memoize the client secret promise for CheckoutProvider
  const clientSecretPromise = useMemo(() => {
    if (!clientSecret) return null;
    return Promise.resolve(clientSecret) as Promise<string>;
  }, [clientSecret]);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Stripe Payment Test</h1>
        <p className="text-muted-foreground">
          Test Stripe payment integration with various scenarios
        </p>
      </div>

      {/* Status Messages */}
      {paymentStatus === "success" && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="text-center text-green-700 dark:text-green-300">
              <p className="font-semibold">Payment Successful!</p>
              <p className="mt-1 text-sm">
                The payment was processed successfully.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentStatus === "canceled" && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-700 dark:text-yellow-300">
              <p className="font-semibold">Payment Canceled</p>
              <p className="mt-1 text-sm">
                The payment was canceled. You can try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Configure your test payment parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (USD)
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.00"
                disabled={!!clientSecret}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <Input
                id="currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="usd"
                disabled={!!clientSecret}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Test Payment"
                disabled={!!clientSecret}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="customerEmail" className="text-sm font-medium">
                Customer Email (optional)
              </label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                disabled={!!clientSecret}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="metadata" className="text-sm font-medium">
                Metadata (key=value, comma-separated)
              </label>
              <Input
                id="metadata"
                type="text"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder="test=true,order_id=123"
                disabled={!!clientSecret}
              />
            </div>

            {sessionError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {sessionError}
              </div>
            )}

            <div className="flex gap-2">
              {clientSecret ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full"
                >
                  Reset
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={createCheckoutSession}
                  disabled={isCreatingSession || !amount}
                  className="w-full"
                >
                  {isCreatingSession ? "Creating Session..." : "Create Payment Session"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Form</CardTitle>
            <CardDescription>
              Enter your payment details to complete the test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clientSecret ? (
              <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
                <div>
                  <p className="mb-2 font-medium">No active session</p>
                  <p className="text-sm">
                    Configure and create a payment session to begin
                  </p>
                </div>
              </div>
            ) : clientSecretPromise ? (
              <CheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret: clientSecretPromise }}
              >
                <CheckoutForm />
              </CheckoutProvider>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Test Scenarios Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Scenarios</CardTitle>
          <CardDescription>
            Quick test scenarios for different payment amounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              onClick={() => {
                setAmount("5.00");
                setDescription("Small Test Payment");
                setMetadata("scenario=small");
              }}
              disabled={!!clientSecret}
            >
              $5.00 Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAmount("10.00");
                setDescription("Standard Test Payment");
                setMetadata("scenario=standard");
              }}
              disabled={!!clientSecret}
            >
              $10.00 Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAmount("50.00");
                setDescription("Large Test Payment");
                setMetadata("scenario=large");
              }}
              disabled={!!clientSecret}
            >
              $50.00 Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAmount("100.00");
                setDescription("Premium Test Payment");
                setMetadata("scenario=premium");
              }}
              disabled={!!clientSecret}
            >
              $100.00 Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>1. Configure Payment:</strong> Set the amount, currency, and
            other parameters in the configuration panel.
          </p>
          <p>
            <strong>2. Create Session:</strong> Click "Create Payment Session"
            to initialize a Stripe Checkout Session.
          </p>
          <p>
            <strong>3. Test Payment:</strong> Use Stripe test card numbers:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>
              <code className="rounded bg-muted px-1 py-0.5">
                4242 4242 4242 4242
              </code>{" "}
              - Success
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5">
                4000 0000 0000 0002
              </code>{" "}
              - Card Declined
            </li>
            <li>
              <code className="rounded bg-muted px-1 py-0.5">
                4000 0000 0000 9995
              </code>{" "}
              - Insufficient Funds
            </li>
          </ul>
          <p>
            Use any future expiry date, any 3-digit CVC, and any postal code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StripeTestPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl space-y-6 p-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Stripe Payment Test</h1>
            <p className="text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <StripeTestPageContent />
    </Suspense>
  );
}

