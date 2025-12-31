import { getStripeCustomer } from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local customer
    const { data: localCustomer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (customerError || !localCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If customer has Stripe ID, fetch Stripe data
    if (localCustomer.stripe_customer_id) {
      const stripeResult = await getStripeCustomer(localCustomer.stripe_customer_id);
      if (stripeResult.success && stripeResult.customer) {
        const stripe = stripeResult.customer;
        return NextResponse.json({
          ...localCustomer,
          stripeEmail: stripe.email,
          stripePhone: stripe.phone,
          stripeAddress: stripe.address
            ? [
                stripe.address.line1,
                stripe.address.line2,
                stripe.address.city,
                stripe.address.state,
                stripe.address.postal_code,
                stripe.address.country,
              ]
                .filter(Boolean)
                .join(", ")
            : null,
        });
      }
    }

    // Return local customer data
    return NextResponse.json(localCustomer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

