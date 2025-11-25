import { logEmail, sendEmail } from "@/lib/email";
import { generateInvoiceEmailTemplate } from "@/lib/email-templates";
import { getPaymentLinkUrl } from "@/lib/invoices";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get invoice with customer details
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers:customer_id (
          name,
          email
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoiceData = invoice as {
      invoice_number: string;
      total: number;
      due_date: string;
      status: string;
      payment_link_token: string | null;
      customers: {
        name: string;
        email: string;
      };
    };

    if (!invoiceData.customers.email) {
      return NextResponse.json({ error: "Customer email not found" }, { status: 400 });
    }

    // Generate payment link if available
    const paymentLink = invoiceData.payment_link_token
      ? getPaymentLinkUrl(invoiceData.payment_link_token)
      : undefined;

    // Generate email template
    const emailHtml = generateInvoiceEmailTemplate({
      invoiceNumber: invoiceData.invoice_number,
      customerName: invoiceData.customers.name,
      total: invoiceData.total,
      dueDate: invoiceData.due_date,
      paymentLink,
    });

    // Send email
    const result = await sendEmail({
      to: invoiceData.customers.email,
      subject: `Invoice ${invoiceData.invoice_number} from Kodo Budget`,
      html: emailHtml,
    });

    // Log email
    await logEmail(
      user.id,
      invoiceData.customers.email,
      `Invoice ${invoiceData.invoice_number} from Kodo Budget`,
      "invoice",
      result.success ? "sent" : "failed",
      result.error || null,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
    }

    // Update invoice status to "sent" if it's currently "draft"
    if (invoiceData.status === "draft") {
      await supabase.from("invoices").update({ status: "sent" } as never).eq("id", invoiceId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error sending invoice email:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
