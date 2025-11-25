export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
}

let config: EmailConfig | null = null;

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig {
  if (config) {
    return config;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Please set it in your environment variables.",
    );
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "noreply@mail.jamienisbet.com";

  config = {
    apiKey,
    fromEmail,
  };

  return config;
}

/**
 * Set email configuration programmatically (useful for testing)
 */
export function setEmailConfig(newConfig: EmailConfig): void {
  config = newConfig;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetEmailConfig(): void {
  config = null;
}

