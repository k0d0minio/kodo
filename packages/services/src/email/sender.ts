import { sendEmailWithResend, type SendEmailResult } from "./client.js";
import {
  renderWelcomeEmail,
  type WelcomeEmailProps
} from "./templates/welcome-email.js";
import {
  renderPasswordResetEmail,
  type PasswordResetEmailProps
} from "./templates/password-reset-email.js";
import {
  renderVerificationEmail,
  type VerificationEmailProps
} from "./templates/verification-email.js";
import {
  renderNotificationEmail,
  type NotificationEmailProps
} from "./templates/notification-email.js";
import {
  renderInvitationEmail,
  type InvitationEmailProps
} from "./templates/invitation-email.js";
import {
  renderThankYouEmail,
  type ThankYouEmailProps
} from "./templates/thank-you-email.js";
import {
  renderTableEmail,
  type TableEmailProps
} from "./templates/table-email.js";
import {
  renderContactFormEmail,
  type ContactFormEmailProps
} from "./templates/contact-form-email.js";

export type EmailTemplate =
  | "welcome"
  | "password-reset"
  | "verification"
  | "notification"
  | "invitation"
  | "thank-you"
  | "table"
  | "contact-form";

export type TemplateProps = {
  welcome: WelcomeEmailProps;
  "password-reset": PasswordResetEmailProps;
  verification: VerificationEmailProps;
  notification: NotificationEmailProps;
  invitation: InvitationEmailProps;
  "thank-you": ThankYouEmailProps;
  table: TableEmailProps;
  "contact-form": ContactFormEmailProps;
};

/**
 * Template renderer mapper - maps template names to their render functions
 */
const templateRenderers: Record<
  EmailTemplate,
  (props: any) => Promise<string>
> = {
  welcome: renderWelcomeEmail,
  "password-reset": renderPasswordResetEmail,
  verification: renderVerificationEmail,
  notification: renderNotificationEmail,
  invitation: renderInvitationEmail,
  "thank-you": renderThankYouEmail,
  table: renderTableEmail,
  "contact-form": renderContactFormEmail
};

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  // Either use a template or provide raw HTML
  template?: EmailTemplate;
  templateProps?: TemplateProps[EmailTemplate];
  html?: string;
}

/**
 * Send an email using a template or raw HTML
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  // Validate that either template or html is provided
  if (!options.template && !options.html) {
    return {
      success: false,
      error: "Either 'template' or 'html' must be provided"
    };
  }

  // If template is provided, render it to HTML
  let html: string | undefined = options.html;

  if (options.template && options.templateProps) {
    // Look up the renderer for the template
    const renderer = templateRenderers[options.template];

    if (renderer) {
      // Use the mapped renderer for known templates
      html = await renderer(options.templateProps);
    } else {
      // Fallback to notification template for unknown templates
      // Extract sensible defaults from available props
      const fallbackProps: NotificationEmailProps = {
        title: options.subject,
        message:
          (options.templateProps as any)?.message ||
          (options.templateProps as any)?.title ||
          "You have received an email notification.",
        userName:
          (options.templateProps as any)?.userName ||
          (options.templateProps as any)?.name,
        footerText: (options.templateProps as any)?.footerText
      };
      html = await renderNotificationEmail(fallbackProps);
    }
  }

  // Send email using Resend
  return sendEmailWithResend({
    to: options.to,
    subject: options.subject,
    html,
    from: options.from,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc
  });
}

/**
 * Send a raw HTML email (convenience function)
 */
export async function sendRawEmail(
  to: string | string[],
  subject: string,
  html: string,
  options?: {
    from?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject,
    html,
    ...options
  });
}
