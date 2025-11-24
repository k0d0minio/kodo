import { resend } from "../instance";
import { PortfolioContactEmail, type PortfolioContactFormValues } from "../templates/portfolio-contact-email";

export const sendPortfolioContactEmail = async (
  data: PortfolioContactFormValues,
  options?: {
    to?: string;
    from?: string;
  },
) => {
  try {
    const recipientEmail = options?.to || process.env.RESEND_EMAIL_RECIPIENT || "noreply@mail.jamienisbet.com";
    const fromEmail = options?.from || process.env.RESEND_FROM_EMAIL || "noreply@mail.jamienisbet.com";

    const res = await resend.emails.send({
      to: recipientEmail,
      from: fromEmail,
      replyTo: data.email,
      subject: `Contact Form: ${data.subject}`,
      react: PortfolioContactEmail(data),
    });
    return { success: res.data?.id != null, error: res.error };
  } catch (error) {
    console.error("Resend email error", error);
    return { success: false, error };
  }
};

