import { createStripeSubscription, updateStripeSubscription, cancelStripeSubscription } from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, subscriptionId, customerId, name, frequency, amount, description, projectId, active } =
      body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "create") {
      // Get customer's Stripe ID
      const { data: localCustomer, error: customerError } = await supabase
        .from("customers")
        .select("stripe_customer_id")
        .eq("id", customerId)
        .eq("user_id", user.id)
        .single();

      if (customerError || !localCustomer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      if (!localCustomer.stripe_customer_id) {
        return NextResponse.json(
          { error: "Customer does not have a Stripe ID. Please ensure the customer is synced with Stripe." },
          { status: 400 },
        );
      }

      // Map frequency to Stripe interval
      const intervalMap: Record<"monthly" | "quarterly" | "yearly", "month" | "year"> = {
        monthly: "month",
        quarterly: "month",
        yearly: "year",
      };

      const intervalCountMap: Record<"monthly" | "quarterly" | "yearly", number> = {
        monthly: 1,
        quarterly: 3,
        yearly: 1,
      };

      // Create subscription in Stripe
      const subscriptionResult = await createStripeSubscription({
        customerId: localCustomer.stripe_customer_id,
        items: [
          {
            priceData: {
              currency: "eur",
              unitAmount: Math.round(amount * 100),
              recurring: {
                interval: intervalMap[frequency as "monthly" | "quarterly" | "yearly"],
                intervalCount: intervalCountMap[frequency as "monthly" | "quarterly" | "yearly"],
              },
              productData: {
                name,
                description: description || undefined,
              },
            },
          },
        ],
        metadata: {
          local_customer_id: customerId,
          ...(projectId && { local_project_id: projectId }),
        },
        collectionMethod: "send_invoice",
      });

      if (!subscriptionResult.success || !subscriptionResult.subscription) {
        return NextResponse.json(
          { error: subscriptionResult.error || "Failed to create subscription in Stripe" },
          { status: 500 },
        );
      }

      // Store minimal data locally
      const { data: localSubscription, error: dbError } = await supabase
        .from("recurring_invoices")
        .insert({
          user_id: user.id,
          name,
          customer_id: customerId,
          project_id: projectId || null,
          stripe_subscription_id: subscriptionResult.subscription.id,
          active:
            subscriptionResult.subscription.status === "active" ||
            subscriptionResult.subscription.status === "trialing",
          frequency: null,
          next_invoice_date: null,
          amount: null,
          description: null,
        })
        .select()
        .single();

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        subscription: localSubscription,
      });
    } else if (action === "update") {
      if (!subscriptionId) {
        return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
      }

      // Get local subscription
      const { data: localSubscription, error: fetchError } = await supabase
        .from("recurring_invoices")
        .select("stripe_subscription_id")
        .eq("id", subscriptionId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !localSubscription || !localSubscription.stripe_subscription_id) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }

      // Update in Stripe
      const updateResult = await updateStripeSubscription(
        localSubscription.stripe_subscription_id,
        {
          metadata: {
            local_recurring_invoice_id: subscriptionId,
            local_customer_id: customerId,
            ...(projectId && { local_project_id: projectId }),
          },
          cancelAtPeriodEnd: !active,
        },
      );

      if (!updateResult.success) {
        return NextResponse.json(
          { error: updateResult.error || "Failed to update subscription in Stripe" },
          { status: 500 },
        );
      }

      // If deactivating, cancel subscription
      if (!active && updateResult.subscription?.status === "active") {
        await cancelStripeSubscription(localSubscription.stripe_subscription_id, false);
      }

      // Update minimal local data
      const { error: updateError } = await supabase
        .from("recurring_invoices")
        .update({
          name,
          active,
        })
        .eq("id", subscriptionId)
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in subscription API:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("id");

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local subscription
    const { data: localSubscription, error: fetchError } = await supabase
      .from("recurring_invoices")
      .select("stripe_subscription_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !localSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Cancel subscription in Stripe if exists
    if (localSubscription.stripe_subscription_id) {
      await cancelStripeSubscription(localSubscription.stripe_subscription_id, true);
    }

    // Delete from local database
    const { error: deleteError } = await supabase
      .from("recurring_invoices")
      .delete()
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

