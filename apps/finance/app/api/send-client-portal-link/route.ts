import { logEmail, sendEmail } from "@/lib/email";
import { generateClientPortalAccessEmailTemplate } from "@/lib/email-templates";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { customerId, email } = await request.json();

    if (!customerId || !email) {
      return NextResponse.json({ error: "Customer ID and email are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("name, email")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Generate access token
    const accessToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days expiry

    // Create or update client portal access
    const { error: accessError } = await supabase.from("client_portal_access").upsert(
      {
        customer_id: customerId,
        email,
        access_token: accessToken,
        token_expires_at: tokenExpiresAt.toISOString(),
      },
      {
        onConflict: "customer_id,email",
      },
    );

    if (accessError) {
      return NextResponse.json({ error: "Failed to create portal access" }, { status: 500 });
    }

    // Generate access link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessLink = `${baseUrl}/client/${accessToken}`;

    // Generate email template
    const emailHtml = generateClientPortalAccessEmailTemplate({
      customerName: customer.name,
      accessLink,
    });

    // Send email
    const result = await sendEmail({
      to: email,
      subject: "Access Your Client Portal - Kodo Budget",
      html: emailHtml,
    });

    // Log email
    await logEmail(
      user.id,
      email,
      "Access Your Client Portal - Kodo Budget",
      "client_portal_access",
      result.success ? "sent" : "failed",
      result.error || null,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, accessLink });
  } catch (error: unknown) {
    console.error("Error sending client portal link:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
