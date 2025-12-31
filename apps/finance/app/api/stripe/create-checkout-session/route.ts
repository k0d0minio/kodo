import { createCheckoutSession } from "@kodo/services/stripe";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      currency = "usd",
      metadata = {},
      customerEmail,
      description,
      returnUrl,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be greater than 0" },
        { status: 400 },
      );
    }

    // Get base URL for return URL if not provided
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const defaultReturnUrl = returnUrl || `${baseUrl}/stripe-test?status=success`;

    const result = await createCheckoutSession({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      customerEmail,
      description,
      returnUrl: defaultReturnUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

