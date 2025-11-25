import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from:
        options.from ||
        process.env.RESEND_FROM_EMAIL ||
        "Kodo Budget <noreply@mail.jamienisbet.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Log email sending attempt to database
 */
export async function logEmail(
  userId: string | null,
  recipientEmail: string,
  subject: string,
  templateType: string | null,
  status: "sent" | "failed" | "pending",
  errorMessage?: string | null,
): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await supabase.from("email_logs").insert({
    user_id: userId,
    recipient_email: recipientEmail,
    subject,
    template_type: templateType,
    status,
    error_message: errorMessage,
  } as never);
}
