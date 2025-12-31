import {
  createStripeCustomer,
  updateStripeCustomer,
  deleteStripeCustomer,
} from "@kodo/services/stripe";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, customerId, ...data } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "create") {
      // Parse business address if provided
      let address: Parameters<typeof createStripeCustomer>[0]["address"] | undefined;
      if (data.business_address) {
        const parts = data.business_address.split(",").map((p: string) => p.trim());
        address = {
          line1: parts[0] || undefined,
          city: parts[1] || undefined,
          postal_code: parts[2] || undefined,
          country: parts[3] || undefined,
        };
      }

      const result = await createStripeCustomer({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone_number || undefined,
        address,
        metadata: {
          ...(data.tva_number && { tva_number: data.tva_number }),
          ...(data.notes && { notes: data.notes }),
        },
      });

      if (!result.success || !result.customer) {
        return NextResponse.json(
          { error: result.error || "Failed to create customer in Stripe" },
          { status: 500 },
        );
      }

      // Store minimal data locally
      const { data: localCustomer, error: dbError } = await supabase
        .from("customers")
        .insert({
          name: data.name,
          user_id: user.id,
          stripe_customer_id: result.customer.id,
          email: null,
          phone_number: null,
          business_address: null,
          tva_number: null,
          notes: null,
        })
        .select()
        .single();

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        customer: {
          ...localCustomer,
          stripeEmail: result.customer.email,
          stripePhone: result.customer.phone,
          stripeAddress: result.customer.address
            ? [
                result.customer.address.line1,
                result.customer.address.line2,
                result.customer.address.city,
                result.customer.address.state,
                result.customer.address.postal_code,
                result.customer.address.country,
              ]
                .filter(Boolean)
                .join(", ")
            : null,
        },
      });
    } else if (action === "update") {
      if (!customerId) {
        return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
      }

      // Get local customer to find Stripe ID
      const { data: localCustomer, error: fetchError } = await supabase
        .from("customers")
        .select("stripe_customer_id")
        .eq("id", customerId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !localCustomer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      if (!localCustomer.stripe_customer_id) {
        return NextResponse.json(
          { error: "Customer does not have a Stripe ID" },
          { status: 400 },
        );
      }

      // Parse business address if provided
      let address: Parameters<typeof updateStripeCustomer>[1]["address"] | undefined;
      if (data.business_address) {
        const parts = data.business_address.split(",").map((p: string) => p.trim());
        address = {
          line1: parts[0] || undefined,
          city: parts[1] || undefined,
          postal_code: parts[2] || undefined,
          country: parts[3] || undefined,
        };
      }

      const result = await updateStripeCustomer(localCustomer.stripe_customer_id, {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone_number || undefined,
        address,
        metadata: {
          local_customer_id: customerId,
          ...(data.tva_number && { tva_number: data.tva_number }),
          ...(data.notes && { notes: data.notes }),
        },
      });

      if (!result.success || !result.customer) {
        return NextResponse.json(
          { error: result.error || "Failed to update customer in Stripe" },
          { status: 500 },
        );
      }

      // Update minimal local data
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          name: data.name,
          email: null,
          phone_number: null,
          business_address: null,
          tva_number: null,
          notes: null,
        })
        .eq("id", customerId)
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        customer: {
          id: customerId,
          stripeEmail: result.customer.email,
          stripePhone: result.customer.phone,
          stripeAddress: result.customer.address
            ? [
                result.customer.address.line1,
                result.customer.address.line2,
                result.customer.address.city,
                result.customer.address.state,
                result.customer.address.postal_code,
                result.customer.address.country,
              ]
                .filter(Boolean)
                .join(", ")
            : null,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in customer API:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("id");

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get local customer to find Stripe ID
    const { data: localCustomer, error: fetchError } = await supabase
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", customerId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !localCustomer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Delete from Stripe if exists
    if (localCustomer.stripe_customer_id) {
      await deleteStripeCustomer(localCustomer.stripe_customer_id);
    }

    // Delete from local database
    const { error: deleteError } = await supabase
      .from("customers")
      .delete()
      .eq("id", customerId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

