import { Resend } from "resend";
import type { ReactElement } from "react";
import { getEmailConfig } from "./config.js";

let resendInstance: Resend | null = null;

/**
 * Get or create Resend client instance
 */
export function getResendClient(): Resend {
  if (resendInstance) {
    return resendInstance;
  }

  const config = getEmailConfig();
  resendInstance = new Resend(config.apiKey);
  return resendInstance;
}

/**
 * Send email using Resend
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  react?: ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function sendEmailWithResend(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  try {
    const config = getEmailConfig();
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: options.from || config.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      react: options.react,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Unknown error from Resend",
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

